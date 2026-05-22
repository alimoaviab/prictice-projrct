// Package examsecurity implements exam proctoring and anti-cheat endpoints.
package examsecurity

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store *store.MemStore
	Save  func(string, any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Save: save}
}

// SaveSettings saves security settings for an exam.
func (h *Handler) SaveSettings(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	var body store.ExamSecuritySettings
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}
	body.ExamID = examID

	h.Store.Lock()
	found := false
	for i, s := range h.Store.ExamSecuritySettings {
		if s.ExamID == examID {
			h.Store.ExamSecuritySettings[i] = &body
			found = true
			break
		}
	}
	if !found {
		h.Store.ExamSecuritySettings = append(h.Store.ExamSecuritySettings, &body)
	}
	h.Store.Unlock()
	h.Save("exam_security_settings", &body)
	api.WriteResult(w, api.Ok(body))
}

// GetSettings returns security settings for an exam.
func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	h.Store.RLock()
	defer h.Store.RUnlock()
	for _, s := range h.Store.ExamSecuritySettings {
		if s.ExamID == examID {
			api.WriteResult(w, api.Ok(s))
			return
		}
	}
	// Return defaults
	api.WriteResult(w, api.Ok(store.ExamSecuritySettings{
		ExamID: examID, ShuffleQuestions: true, ShuffleOptions: true,
		MaxTabSwitches: 3, RequireFullscreen: false,
	}))
}

// LogEvent records a security event from the student client.
func (h *Handler) LogEvent(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body struct {
		ExamID    string `json:"exam_id"`
		EventType string `json:"event_type"`
		EventData string `json:"event_data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON.", 400, nil))
		return
	}

	log := &store.ExamSecurityLog{
		ID:        store.NewID("seclog"),
		ExamID:    body.ExamID,
		StudentID: ctx.UserID,
		EventType: body.EventType,
		EventData: body.EventData,
		Timestamp: time.Now(),
	}
	h.Store.Lock()
	h.Store.ExamSecurityLogs = append(h.Store.ExamSecurityLogs, log)
	h.Store.Unlock()
	h.Save("exam_security_logs", log)
	api.WriteResult(w, api.Ok(map[string]any{"logged": true}))
}

// GetLogs returns security logs for an exam (admin view).
func (h *Handler) GetLogs(w http.ResponseWriter, r *http.Request) {
	examID := chi.URLParam(r, "id")
	studentID := r.URL.Query().Get("student_id")

	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]map[string]any, 0)
	for _, l := range h.Store.ExamSecurityLogs {
		if l.ExamID != examID {
			continue
		}
		if studentID != "" && l.StudentID != studentID {
			continue
		}
		out = append(out, map[string]any{
			"_id": l.ID, "student_id": l.StudentID, "event_type": l.EventType,
			"event_data": l.EventData, "timestamp": l.Timestamp,
		})
	}
	api.WriteResult(w, api.Ok(out))
}
