// memory.go — Conversation memory and entity tracking.
//
// Tracks entities mentioned in conversation (student names, class names, etc.)
// so follow-up questions like "uski attendance?" resolve correctly.
// Memory is per-session (stored in Redis with 30-min TTL).
package chatbot

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
)

// ConversationMemory tracks context across messages in a session.
type ConversationMemory struct {
	LastStudent  string `json:"last_student,omitempty"`
	LastClass    string `json:"last_class,omitempty"`
	LastTeacher  string `json:"last_teacher,omitempty"`
	LastTopic    string `json:"last_topic,omitempty"`
	LastIntent   string `json:"last_intent,omitempty"`
	MessageCount int    `json:"message_count"`
	UpdatedAt    int64  `json:"updated_at"`
}

const memoryTTL = 30 * time.Minute

func memoryKey(userID string) string {
	return fmt.Sprintf("chat:memory:%s", userID)
}

// LoadMemory retrieves conversation memory from Redis.
func LoadMemory(ctx context.Context, c *cache.Client, userID string) *ConversationMemory {
	if c == nil || !c.Available() {
		return &ConversationMemory{}
	}
	data, err := c.Get(ctx, memoryKey(userID))
	if err != nil || data == nil {
		return &ConversationMemory{}
	}
	var mem ConversationMemory
	if json.Unmarshal(data, &mem) != nil {
		return &ConversationMemory{}
	}
	return &mem
}

// SaveMemory persists conversation memory to Redis.
func SaveMemory(ctx context.Context, c *cache.Client, userID string, mem *ConversationMemory) {
	if c == nil || !c.Available() || mem == nil {
		return
	}
	mem.UpdatedAt = time.Now().Unix()
	mem.MessageCount++
	data, err := json.Marshal(mem)
	if err != nil {
		return
	}
	_ = c.Set(ctx, memoryKey(userID), data, memoryTTL)
}

// UpdateMemoryFromIntent updates memory based on detected intent and entities.
func UpdateMemoryFromIntent(mem *ConversationMemory, category string, entities map[string]string) {
	mem.LastTopic = category
	if name, ok := entities["student_name"]; ok && name != "" {
		mem.LastStudent = name
	}
	if name, ok := entities["name"]; ok && name != "" {
		if category == "student" {
			mem.LastStudent = name
		} else if category == "teacher" {
			mem.LastTeacher = name
		}
	}
	if name, ok := entities["class_name"]; ok && name != "" {
		mem.LastClass = name
	}
	if name, ok := entities["teacher_name"]; ok && name != "" {
		mem.LastTeacher = name
	}
}

// ResolvePronouns replaces pronouns with remembered entities.
// "uski attendance" → resolves "uski" to last mentioned student.
func ResolvePronouns(msg string, mem *ConversationMemory) (string, map[string]string) {
	resolved := map[string]string{}
	// If message contains pronouns and we have memory, inject context
	if mem.LastStudent != "" && containsAny(msg, "uski", "uska", "iska", "iski", "us", "his", "her", "their") {
		resolved["student_name"] = mem.LastStudent
	}
	if mem.LastClass != "" && containsAny(msg, "us class", "usi", "same class", "wahi") {
		resolved["class_name"] = mem.LastClass
	}
	if mem.LastTeacher != "" && containsAny(msg, "unki", "unka", "us teacher") {
		resolved["teacher_name"] = mem.LastTeacher
	}
	return msg, resolved
}
