// Package schedule implements the Smart Schedule & Reminder system.
//
// Architecture:
//   - Calendar CRUD with monthly/weekly/daily views
//   - Redis ZSET-based delayed reminder engine (alarm-style, no polling)
//   - Recurring event generation (only next occurrence, not infinite)
//   - Real-time WebSocket notifications on reminder trigger
//   - Role-based access: admin sees all, teacher sees own + assigned
package schedule

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	rt "github.com/eduplexo/backend-go/internal/realtime"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
)

const (
	reminderZSetKey = "reminders:pending" // Redis Sorted Set: score=unix timestamp, member=reminder JSON
	cacheTTL        = 30 * time.Second
)

// Handler manages schedule CRUD and the reminder engine.
type Handler struct {
	Store   *store.MemStore
	Cache   *cache.Client
	Hub     *rt.Hub
	Persist func(string, any)
	rdb     *redis.Client
}

// New creates a schedule handler.
func New(s *store.MemStore, persist func(string, any), c *cache.Client, hub *rt.Hub, rdb *redis.Client) *Handler {
	h := &Handler{
		Store:   s,
		Cache:   c,
		Hub:     hub,
		Persist: persist,
		rdb:     rdb,
	}
	// Start the reminder dispatcher goroutine
	go h.reminderDispatcher()
	return h
}

// ─── List Schedules ──────────────────────────────────────────────────────

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionView); err != nil {
			return nil, err
		}

		startStr := q.Get("start")
		endStr := q.Get("end")
		eventType := q.Get("event_type")
		status := q.Get("status")
		assignedTo := q.Get("assigned_to")

		var startDate, endDate time.Time
		if startStr != "" {
			if t, err := time.Parse("2006-01-02", startStr); err == nil {
				startDate = t
			}
		}
		if endStr != "" {
			if t, err := time.Parse("2006-01-02", endStr); err == nil {
				endDate = t.Add(24*time.Hour - time.Second)
			}
		}

		h.Store.RLock()
		var rows []*store.Schedule
		for _, s := range h.Store.Schedules {
			if s.SchoolID != ctx.SchoolID {
				continue
			}
			// Role-based filtering: teachers only see own + assigned
			if ctx.Role == "teacher" {
				isOwner := s.CreatedBy == ctx.UserID
				isAssigned := false
				for _, uid := range s.AssignedTo {
					if uid == ctx.UserID {
						isAssigned = true
						break
					}
				}
				if !isOwner && !isAssigned {
					continue
				}
			}
			// Date range filter
			if !startDate.IsZero() && s.EndDatetime.Before(startDate) {
				continue
			}
			if !endDate.IsZero() && s.StartDatetime.After(endDate) {
				continue
			}
			// Type filter
			if eventType != "" && s.EventType != eventType {
				continue
			}
			// Status filter
			if status != "" && s.Status != status {
				continue
			}
			// Assigned filter
			if assignedTo != "" {
				found := false
				for _, uid := range s.AssignedTo {
					if uid == assignedTo {
						found = true
						break
					}
				}
				if !found && s.CreatedBy != assignedTo {
					continue
				}
			}
			rows = append(rows, s)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartDatetime.Before(rows[j].StartDatetime)
		})

		return rows, nil
	}))
}

// ─── Get Single Schedule ─────────────────────────────────────────────────

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	api.WriteResult(w, api.ServiceTry(func() (*store.Schedule, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, s := range h.Store.Schedules {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				return s, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Schedule not found.", 404, nil)
	}))
}

// ─── Create Schedule ─────────────────────────────────────────────────────

type createInput struct {
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	StartDatetime string   `json:"start_datetime"`
	EndDatetime   string   `json:"end_datetime"`
	AllDay        bool     `json:"all_day"`
	EventType     string   `json:"event_type"`
	Priority      string   `json:"priority"`
	Color         string   `json:"color"`
	Location      string   `json:"location"`
	ReminderType  string   `json:"reminder_type"`
	RecurringType string   `json:"recurring_type"`
	RecurringEnd  string   `json:"recurring_end"`
	AssignedTo    []string `json:"assigned_to"`
	Attachments   []string `json:"attachments"`
	Notes         string   `json:"notes"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (*store.Schedule, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.Title == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "title is required.", 400, nil)
		}
		if body.StartDatetime == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "start_datetime is required.", 400, nil)
		}

		startDT, err := time.Parse(time.RFC3339, body.StartDatetime)
		if err != nil {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid start_datetime format. Use RFC3339.", 400, nil)
		}
		endDT := startDT.Add(1 * time.Hour) // default 1 hour
		if body.EndDatetime != "" {
			if t, err := time.Parse(time.RFC3339, body.EndDatetime); err == nil {
				endDT = t
			}
		}

		// Defaults
		eventType := body.EventType
		if eventType == "" {
			eventType = "event"
		}
		priority := body.Priority
		if priority == "" {
			priority = "medium"
		}
		reminderType := body.ReminderType
		if reminderType == "" {
			reminderType = "none"
		}
		recurringType := body.RecurringType
		if recurringType == "" {
			recurringType = "none"
		}

		now := time.Now()
		sched := &store.Schedule{
			ID:            store.NewID("sched"),
			SchoolID:      ctx.SchoolID,
			Title:         body.Title,
			Description:   body.Description,
			StartDatetime: startDT,
			EndDatetime:   endDT,
			AllDay:        body.AllDay,
			EventType:     eventType,
			Priority:      priority,
			Status:        "pending",
			Color:         body.Color,
			Location:      body.Location,
			ReminderType:  reminderType,
			RecurringType: recurringType,
			AssignedTo:    body.AssignedTo,
			CreatedBy:     ctx.UserID,
			Attachments:   body.Attachments,
			Notes:         body.Notes,
			CreatedAt:     now,
			UpdatedAt:     now,
		}

		if body.RecurringEnd != "" {
			if t, err := time.Parse(time.RFC3339, body.RecurringEnd); err == nil {
				sched.RecurringEnd = &t
			}
		}

		h.Store.Lock()
		h.Store.Schedules = append(h.Store.Schedules, sched)
		h.Store.Unlock()
		h.Persist("schedules", sched)

		// Schedule reminder if needed
		h.scheduleReminder(sched, ctx.UserID)

		// Schedule reminders for assigned users too
		for _, uid := range sched.AssignedTo {
			if uid != ctx.UserID {
				h.scheduleReminder(sched, uid)
			}
		}

		return sched, nil
	}))
}

// ─── Update Schedule ─────────────────────────────────────────────────────

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	var body map[string]any
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (*store.Schedule, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionUpdate); err != nil {
			return nil, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		var target *store.Schedule
		for _, s := range h.Store.Schedules {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				target = s
				break
			}
		}
		if target == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Schedule not found.", 404, nil)
		}

		// Permission check: teachers can only edit own schedules
		if ctx.Role == "teacher" && target.CreatedBy != ctx.UserID {
			return nil, api.NewControlledError("FORBIDDEN", "You can only edit your own schedules.", 403, nil)
		}

		// Apply updates
		if v, ok := body["title"].(string); ok && v != "" {
			target.Title = v
		}
		if v, ok := body["description"].(string); ok {
			target.Description = v
		}
		if v, ok := body["start_datetime"].(string); ok && v != "" {
			if t, err := time.Parse(time.RFC3339, v); err == nil {
				target.StartDatetime = t
			}
		}
		if v, ok := body["end_datetime"].(string); ok && v != "" {
			if t, err := time.Parse(time.RFC3339, v); err == nil {
				target.EndDatetime = t
			}
		}
		if v, ok := body["event_type"].(string); ok && v != "" {
			target.EventType = v
		}
		if v, ok := body["priority"].(string); ok && v != "" {
			target.Priority = v
		}
		if v, ok := body["status"].(string); ok && v != "" {
			target.Status = v
		}
		if v, ok := body["color"].(string); ok {
			target.Color = v
		}
		if v, ok := body["location"].(string); ok {
			target.Location = v
		}
		if v, ok := body["reminder_type"].(string); ok {
			target.ReminderType = v
		}
		if v, ok := body["notes"].(string); ok {
			target.Notes = v
		}
		if v, ok := body["assigned_to"].([]any); ok {
			ids := make([]string, 0, len(v))
			for _, item := range v {
				if s, ok := item.(string); ok {
					ids = append(ids, s)
				}
			}
			target.AssignedTo = ids
		}

		target.UpdatedAt = time.Now()
		h.Persist("schedules", target)

		return target, nil
	}))
}

// ─── Delete Schedule ─────────────────────────────────────────────────────

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionDelete); err != nil {
			return nil, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		idx := -1
		for i, s := range h.Store.Schedules {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				// Teachers can only delete own
				if ctx.Role == "teacher" && s.CreatedBy != ctx.UserID {
					return nil, api.NewControlledError("FORBIDDEN", "You can only delete your own schedules.", 403, nil)
				}
				idx = i
				break
			}
		}
		if idx == -1 {
			return nil, api.NewControlledError("NOT_FOUND", "Schedule not found.", 404, nil)
		}

		h.Store.Schedules = append(h.Store.Schedules[:idx], h.Store.Schedules[idx+1:]...)
		h.Persist("schedules:delete", id)

		// Remove pending reminders for this schedule
		h.cancelReminders(id)

		return map[string]any{"deleted": true}, nil
	}))
}

// ─── Reminder Engine (Redis ZSET-based delayed execution) ────────────────

// scheduleReminder calculates the reminder time and adds it to the Redis ZSET.
// This is the "alarm-style" approach — no polling, no cron scanning.
func (h *Handler) scheduleReminder(sched *store.Schedule, userID string) {
	if sched.ReminderType == "none" || sched.ReminderType == "" {
		return
	}

	triggerAt := h.calculateReminderTime(sched)
	if triggerAt.Before(time.Now()) {
		return // Don't schedule past reminders
	}

	reminder := &store.ScheduleReminder{
		ID:         store.NewID("rem"),
		SchoolID:   sched.SchoolID,
		ScheduleID: sched.ID,
		UserID:     userID,
		TriggerAt:  triggerAt,
		Status:     "pending",
		NotifyType: "in_app",
		CreatedAt:  time.Now(),
	}

	h.Store.Lock()
	h.Store.ScheduleReminders = append(h.Store.ScheduleReminders, reminder)
	h.Store.Unlock()
	h.Persist("schedule_reminders", reminder)

	// Add to Redis ZSET with score = unix timestamp
	if h.rdb != nil {
		payload, _ := json.Marshal(map[string]string{
			"id":          reminder.ID,
			"schedule_id": sched.ID,
			"school_id":   sched.SchoolID,
			"user_id":     userID,
			"title":       sched.Title,
		})
		h.rdb.ZAdd(context.Background(), reminderZSetKey, redis.Z{
			Score:  float64(triggerAt.Unix()),
			Member: string(payload),
		})
	}
}

// calculateReminderTime returns when the reminder should fire.
func (h *Handler) calculateReminderTime(sched *store.Schedule) time.Time {
	switch sched.ReminderType {
	case "at_time":
		return sched.StartDatetime
	case "30min":
		return sched.StartDatetime.Add(-30 * time.Minute)
	case "1hour":
		return sched.StartDatetime.Add(-1 * time.Hour)
	case "1day":
		return sched.StartDatetime.Add(-24 * time.Hour)
	default:
		return sched.StartDatetime
	}
}

// cancelReminders removes all pending reminders for a schedule from Redis.
func (h *Handler) cancelReminders(scheduleID string) {
	if h.rdb == nil {
		return
	}
	// Remove from in-memory store
	var kept []*store.ScheduleReminder
	for _, r := range h.Store.ScheduleReminders {
		if r.ScheduleID != scheduleID {
			kept = append(kept, r)
		}
	}
	h.Store.ScheduleReminders = kept

	// Remove from Redis ZSET (scan and remove matching entries)
	ctx := context.Background()
	members, _ := h.rdb.ZRangeByScore(ctx, reminderZSetKey, &redis.ZRangeBy{
		Min: "-inf",
		Max: "+inf",
	}).Result()
	for _, m := range members {
		if strings.Contains(m, scheduleID) {
			h.rdb.ZRem(ctx, reminderZSetKey, m)
		}
	}
}

// reminderDispatcher is the background goroutine that checks Redis ZSET
// every 5 seconds for due reminders and dispatches them.
// This is much more efficient than scanning the database every minute.
func (h *Handler) reminderDispatcher() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if h.rdb == nil {
			continue
		}
		h.processDueReminders()
	}
}

// processDueReminders fetches all reminders with score <= now and dispatches them.
func (h *Handler) processDueReminders() {
	ctx := context.Background()
	now := float64(time.Now().Unix())

	// ZRANGEBYSCORE to get all due reminders
	results, err := h.rdb.ZRangeByScore(ctx, reminderZSetKey, &redis.ZRangeBy{
		Min: "-inf",
		Max: fmt.Sprintf("%f", now),
	}).Result()
	if err != nil || len(results) == 0 {
		return
	}

	for _, member := range results {
		var data map[string]string
		if err := json.Unmarshal([]byte(member), &data); err != nil {
			continue
		}

		// Send notification via WebSocket
		if h.Hub != nil {
			h.Hub.SendToUser(data["school_id"], data["user_id"], rt.Message{
				Type: "schedule_reminder",
				Payload: map[string]any{
					"schedule_id": data["schedule_id"],
					"title":       data["title"],
					"message":     fmt.Sprintf("Reminder: %s", data["title"]),
					"triggered_at": time.Now(),
				},
			})
		}

		// Also create an in-app notification
		h.createNotification(data)

		// Mark reminder as sent
		h.markReminderSent(data["id"])

		// Remove from ZSET
		h.rdb.ZRem(ctx, reminderZSetKey, member)
	}

	if len(results) > 0 {
		log.Printf("[schedule] dispatched %d reminders", len(results))
	}
}

// createNotification creates an in-app notification for the reminder.
func (h *Handler) createNotification(data map[string]string) {
	now := time.Now()
	notif := &store.Notification{
		ID:        store.NewID("notif"),
		SchoolID:  data["school_id"],
		UserID:    data["user_id"],
		Title:     "Schedule Reminder",
		Body:      fmt.Sprintf("Reminder: %s", data["title"]),
		Category:  "reminder",
		Read:      false,
		CreatedAt: now,
	}
	h.Store.Lock()
	h.Store.Notifications = append(h.Store.Notifications, notif)
	h.Store.Unlock()
	h.Persist("notifications", notif)
}

// markReminderSent updates the reminder status in memory and DB.
func (h *Handler) markReminderSent(reminderID string) {
	now := time.Now()
	h.Store.Lock()
	for _, r := range h.Store.ScheduleReminders {
		if r.ID == reminderID {
			r.Status = "sent"
			r.SentAt = &now
			h.Persist("schedule_reminders", r)
			break
		}
	}
	h.Store.Unlock()
}

// ─── Recurring Event Generation ──────────────────────────────────────────

// GenerateNextOccurrence creates the next instance of a recurring schedule.
// Called after a recurring event completes. Only generates ONE next occurrence.
func (h *Handler) GenerateNextOccurrence(sched *store.Schedule) *store.Schedule {
	if sched.RecurringType == "none" || sched.RecurringType == "" {
		return nil
	}

	duration := sched.EndDatetime.Sub(sched.StartDatetime)
	var nextStart time.Time

	switch sched.RecurringType {
	case "daily":
		nextStart = sched.StartDatetime.Add(24 * time.Hour)
	case "weekly":
		nextStart = sched.StartDatetime.Add(7 * 24 * time.Hour)
	case "monthly":
		nextStart = sched.StartDatetime.AddDate(0, 1, 0)
	default:
		return nil
	}

	// Check if past recurring end date
	if sched.RecurringEnd != nil && nextStart.After(*sched.RecurringEnd) {
		return nil
	}

	now := time.Now()
	parentID := sched.RecurringParent
	if parentID == "" {
		parentID = sched.ID
	}

	next := &store.Schedule{
		ID:              store.NewID("sched"),
		SchoolID:        sched.SchoolID,
		Title:           sched.Title,
		Description:     sched.Description,
		StartDatetime:   nextStart,
		EndDatetime:     nextStart.Add(duration),
		AllDay:          sched.AllDay,
		EventType:       sched.EventType,
		Priority:        sched.Priority,
		Status:          "pending",
		Color:           sched.Color,
		Location:        sched.Location,
		ReminderType:    sched.ReminderType,
		RecurringType:   sched.RecurringType,
		RecurringEnd:    sched.RecurringEnd,
		RecurringParent: parentID,
		AssignedTo:      sched.AssignedTo,
		CreatedBy:       sched.CreatedBy,
		Notes:           sched.Notes,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	h.Store.Lock()
	h.Store.Schedules = append(h.Store.Schedules, next)
	h.Store.Unlock()
	h.Persist("schedules", next)

	// Schedule reminder for next occurrence
	h.scheduleReminder(next, next.CreatedBy)
	for _, uid := range next.AssignedTo {
		if uid != next.CreatedBy {
			h.scheduleReminder(next, uid)
		}
	}

	return next
}

// ─── Mark Complete (with recurring generation) ───────────────────────────

func (h *Handler) MarkComplete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	api.WriteResult(w, api.ServiceTry(func() (*store.Schedule, error) {
		if err := auth.AssertPermission(ctx, "schedules", auth.ActionUpdate); err != nil {
			return nil, err
		}

		h.Store.Lock()
		var target *store.Schedule
		for _, s := range h.Store.Schedules {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				target = s
				break
			}
		}
		if target == nil {
			h.Store.Unlock()
			return nil, api.NewControlledError("NOT_FOUND", "Schedule not found.", 404, nil)
		}

		target.Status = "completed"
		target.UpdatedAt = time.Now()
		h.Store.Unlock()
		h.Persist("schedules", target)

		// Generate next occurrence for recurring events
		if target.RecurringType != "none" && target.RecurringType != "" {
			h.GenerateNextOccurrence(target)
		}

		return target, nil
	}))
}
