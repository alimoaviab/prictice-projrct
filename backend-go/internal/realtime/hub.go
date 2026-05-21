// Package realtime provides a WebSocket hub with Redis Pub/Sub fan-out.
//
// Architecture:
//
//	Client → WS /ws → Hub.ServeWS() → registers connection
//	Redis Pub/Sub → Hub.subscribeSchool() → fan-out to all school's connections
//
// Thread safety: sync.RWMutex protects the connections map.
// Keepalive: ping/pong every 30s, 45s read deadline.
// Cleanup: on disconnect, remove from map + unsubscribe if last user in school.
package realtime

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/metrics"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 45 * time.Second
	pingInterval   = 30 * time.Second
	maxMessageSize = 4096
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate against allowed origins.
		// For now, allow all (CORS middleware handles origin checks).
		return true
	},
}

// Message is the envelope sent over WebSocket to clients.
type Message struct {
	Type    string `json:"type"`    // "notification", "attendance", "fee_update", "job_progress"
	Payload any    `json:"payload"` // Event-specific data
}

// conn wraps a WebSocket connection with metadata.
type conn struct {
	ws       *websocket.Conn
	schoolID string
	userID   string
	send     chan []byte
}

// Hub manages all WebSocket connections and Redis Pub/Sub subscriptions.
type Hub struct {
	// connections: schoolID → userID → connection
	mu    sync.RWMutex
	conns map[string]map[string]*conn

	// Redis client for Pub/Sub
	rdb *redis.Client

	// Active Redis subscriptions per school
	subMu sync.Mutex
	subs  map[string]*redis.PubSub

	// Context for graceful shutdown
	ctx    context.Context
	cancel context.CancelFunc
}

// NewHub creates a WebSocket hub with Redis Pub/Sub integration.
func NewHub(rdb *redis.Client) *Hub {
	ctx, cancel := context.WithCancel(context.Background())
	return &Hub{
		conns:  make(map[string]map[string]*conn),
		rdb:    rdb,
		subs:   make(map[string]*redis.PubSub),
		ctx:    ctx,
		cancel: cancel,
	}
}

// Shutdown gracefully closes all connections and subscriptions.
func (h *Hub) Shutdown() {
	h.cancel()

	h.subMu.Lock()
	for _, sub := range h.subs {
		_ = sub.Close()
	}
	h.subMu.Unlock()

	h.mu.Lock()
	for _, school := range h.conns {
		for _, c := range school {
			close(c.send)
			_ = c.ws.Close()
		}
	}
	h.mu.Unlock()
}

// ServeWS handles WebSocket upgrade requests.
// Route: r.Get("/ws", hub.ServeWS)
//
// The client must be authenticated — school_id and user_id are extracted
// from the JWT (already validated by the auth middleware).
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	reqCtx := api.FromRequest(r)
	if reqCtx == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ws] upgrade failed: %v", err)
		return
	}

	c := &conn{
		ws:       wsConn,
		schoolID: reqCtx.SchoolID,
		userID:   reqCtx.UserID,
		send:     make(chan []byte, 64),
	}

	h.register(c)
	metrics.ActiveWebsockets.Inc()

	// Start read/write pumps
	go h.writePump(c)
	go h.readPump(c)
}

// register adds a connection to the hub and starts Redis subscription if needed.
func (h *Hub) register(c *conn) {
	h.mu.Lock()
	if h.conns[c.schoolID] == nil {
		h.conns[c.schoolID] = make(map[string]*conn)
	}
	h.conns[c.schoolID][c.userID] = c
	schoolConnCount := len(h.conns[c.schoolID])
	h.mu.Unlock()

	log.Printf("[ws] connected: school=%s user=%s (school_total=%d)", c.schoolID, c.userID, schoolConnCount)

	// Subscribe to Redis channels for this school (if first connection)
	if schoolConnCount == 1 {
		h.subscribeSchool(c.schoolID)
	}
}

// unregister removes a connection and cleans up subscriptions.
func (h *Hub) unregister(c *conn) {
	h.mu.Lock()
	if school, ok := h.conns[c.schoolID]; ok {
		if _, exists := school[c.userID]; exists {
			delete(school, c.userID)
			close(c.send)
		}
		if len(school) == 0 {
			delete(h.conns, c.schoolID)
		}
	}
	remaining := len(h.conns[c.schoolID])
	h.mu.Unlock()

	metrics.ActiveWebsockets.Dec()
	log.Printf("[ws] disconnected: school=%s user=%s (remaining=%d)", c.schoolID, c.userID, remaining)

	// Unsubscribe from Redis if no more connections for this school
	if remaining == 0 {
		h.unsubscribeSchool(c.schoolID)
	}
}

// ─── Redis Pub/Sub ───────────────────────────────────────────────────────

// subscribeSchool starts listening to Redis channels for a school.
func (h *Hub) subscribeSchool(schoolID string) {
	if h.rdb == nil {
		return
	}

	channels := []string{
		"school:" + schoolID + ":notifications",
		"school:" + schoolID + ":attendance",
		"school:" + schoolID + ":fees",
		"school:" + schoolID + ":jobs",
	}

	sub := h.rdb.Subscribe(h.ctx, channels...)

	h.subMu.Lock()
	h.subs[schoolID] = sub
	h.subMu.Unlock()

	// Listen for messages in a goroutine
	go func() {
		ch := sub.Channel()
		for msg := range ch {
			h.fanOut(schoolID, []byte(msg.Payload))
		}
	}()

	log.Printf("[ws] subscribed to Redis channels for school=%s", schoolID)
}

// unsubscribeSchool stops listening to Redis channels for a school.
func (h *Hub) unsubscribeSchool(schoolID string) {
	h.subMu.Lock()
	sub, ok := h.subs[schoolID]
	if ok {
		delete(h.subs, schoolID)
	}
	h.subMu.Unlock()

	if ok && sub != nil {
		_ = sub.Close()
		log.Printf("[ws] unsubscribed from Redis channels for school=%s", schoolID)
	}
}

// fanOut sends a message to all connected users in a school.
func (h *Hub) fanOut(schoolID string, data []byte) {
	h.mu.RLock()
	school := h.conns[schoolID]
	if school == nil {
		h.mu.RUnlock()
		return
	}
	// Copy to avoid holding lock during sends
	targets := make([]*conn, 0, len(school))
	for _, c := range school {
		targets = append(targets, c)
	}
	h.mu.RUnlock()

	for _, c := range targets {
		select {
		case c.send <- data:
		default:
			// Buffer full — drop message for this client
			log.Printf("[ws] send buffer full, dropping message for user=%s", c.userID)
		}
	}
}

// SendToUser sends a message to a specific user (if connected).
func (h *Hub) SendToUser(schoolID, userID string, msg Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	h.mu.RLock()
	school := h.conns[schoolID]
	if school == nil {
		h.mu.RUnlock()
		return
	}
	c, ok := school[userID]
	h.mu.RUnlock()

	if ok {
		select {
		case c.send <- data:
		default:
		}
	}
}

// Publish sends a message to all users in a school via Redis Pub/Sub.
// This works across multiple backend instances.
func (h *Hub) Publish(ctx context.Context, schoolID, channel string, msg Message) error {
	if h.rdb == nil {
		// No Redis — direct fan-out (single instance only)
		data, err := json.Marshal(msg)
		if err != nil {
			return err
		}
		h.fanOut(schoolID, data)
		return nil
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	fullChannel := "school:" + schoolID + ":" + channel
	return h.rdb.Publish(ctx, fullChannel, data).Err()
}

// ─── Read/Write Pumps ────────────────────────────────────────────────────

// readPump reads messages from the WebSocket (handles pong, close).
func (h *Hub) readPump(c *conn) {
	defer func() {
		h.unregister(c)
		_ = c.ws.Close()
	}()

	c.ws.SetReadLimit(maxMessageSize)
	_ = c.ws.SetReadDeadline(time.Now().Add(pongWait))
	c.ws.SetPongHandler(func(string) error {
		_ = c.ws.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, _, err := c.ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[ws] read error: %v", err)
			}
			break
		}
		// We don't process incoming messages from clients (read-only push model).
		// If needed in the future, handle client messages here.
	}
}

// writePump sends messages from the send channel to the WebSocket.
func (h *Hub) writePump(c *conn) {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		_ = c.ws.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			_ = c.ws.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Channel closed — send close frame
				_ = c.ws.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.ws.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			_, _ = w.Write(message)

			// Drain queued messages into the same write (batch)
			n := len(c.send)
			for i := 0; i < n; i++ {
				_, _ = w.Write([]byte("\n"))
				_, _ = w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			// Send ping
			_ = c.ws.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.ws.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
