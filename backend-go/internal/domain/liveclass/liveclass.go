// Package liveclass implements /api/live/classes endpoints.
//
// Live classes use public Jitsi Meet rooms (https://meet.jit.si). The backend
// generates a unique, secure room URL per session and stores it in the
// database. Teachers and students join by clicking the link — Jitsi handles
// all audio/video/WebRTC/media. No self-hosted infrastructure required.
package liveclass

import (
	"crypto/rand"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/access"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// liveClassListCacheTTL — short window so newly-scheduled live classes
// surface quickly. Same TTL as other phase-8 list caches.
const liveClassListCacheTTL = 60 * time.Second

// Handler holds dependencies for live class endpoints.
type Handler struct {
	Store *store.MemStore
	Save  func(table string, doc any)
	Cache *cache.Client
}

// New returns a live class handler. `save` is optional — pass nil for
// in-memory-only mode (tests, dev without PG).
func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Save: save}
}

// NewWithCache attaches a Redis client. Pass nil to opt out — handler
// degrades to original (no-cache) behaviour.
func NewWithCache(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	h := New(s, save)
	h.Cache = c
	return h
}

// listCacheKey hashes filter inputs for a stable per-tenant key.
// Role + profile id are part of the key because students see only their
// own class while admins/teachers can see the whole school.
func listCacheKey(schoolID, role, profileID, query string) string {
	src := fmt.Sprintf("%s|%s|%s|%s", schoolID, role, profileID, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("liveclass:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("liveclass:list:%s:*", schoolID))
}

// ─── Jitsi Room URL Generator ────────────────────────────────────────────

// generateJitsiURL creates a unique, secure Jitsi Meet room URL.
// Format: https://meet.jit.si/eduplexo-{schoolID}-{randomHex}
//
// The room name is:
//   - Prefixed with "eduplexo-" to avoid collisions with other Jitsi users
//   - Includes the school_id for traceability in logs
//   - Ends with 16 random hex chars (64 bits of entropy) — effectively
//     unguessable by outsiders
//   - Sanitized to only contain URL-safe characters
func generateJitsiURL(schoolID string) string {
	// Generate 8 random bytes = 16 hex chars
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		// Fallback to timestamp-based if crypto/rand fails (extremely rare)
		b = []byte(time.Now().Format("20060102150405"))
	}
	randomPart := hex.EncodeToString(b)

	// Sanitize school ID: only keep alphanumeric and hyphens
	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, schoolID)
	if safe == "" {
		safe = "school"
	}
	// Keep school prefix short
	if len(safe) > 20 {
		safe = safe[:20]
	}

	return "https://meet.jit.si/eduplexo-" + safe + "-" + randomPart
}

// ─── Hydration (response shaping) ───────────────────────────────────────

func (h *Handler) hydrate(rows []*store.LiveClass) []map[string]any {
	classByID := map[string]*store.Class{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	out := make([]map[string]any, 0, len(rows))
	for _, l := range rows {
		cls := classByID[l.ClassID]
		className := ""
		if cls != nil {
			className = cls.Name
		}
		out = append(out, map[string]any{
			"_id":               l.ID,
			"school_id":         l.SchoolID,
			"academic_year_id":  l.AcademicYearID,
			"class_id":          l.ClassID,
			"class_name":        className,
			"subject":           l.Subject,
			"title":             l.Title,
			"description":       l.Description,
			"starts_at":         l.StartsAt,
			"ends_at":           l.EndsAt,
			"host_teacher_id":   l.HostTeacherID,
			"join_url":          l.JoinURL,
			"provider":          l.Provider,
			"status":            l.Status,
			"audience_type":     l.AudienceType,    // CLASS or STUDENT
			"target_student_id": l.TargetStudentID, // optional, for specific student
			"created_at":        l.CreatedAt,
			"updated_at":        l.UpdatedAt,
		})
	}
	return out
}

// ─── List ────────────────────────────────────────────────────────────────

// List implements GET /api/live/classes.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	// Resolve student profile id outside the cache-key calc so students
	// from different classes don't share a cache entry.
	var profileID string
	if ctx.Role == "student" || ctx.Role == "teacher" || ctx.Role == "parent" {
		h.Store.RLock()
		switch ctx.Role {
		case "student":
			if s := access.StudentProfileLocked(h.Store, ctx); s != nil {
				profileID = s.ID
			}
		case "teacher":
			if t := access.TeacherProfileLocked(h.Store, ctx); t != nil {
				profileID = t.ID
			}
		case "parent":
			for id := range access.ParentStudentIDsLocked(h.Store, ctx) {
				profileID += id + ","
			}
		}
		h.Store.RUnlock()
	}

	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, profileID, q.Encode())
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		statusQ := q.Get("status")

		// Student scoping: only their class.
		if ctx.Role == "student" {
			h.Store.RLock()
			if s := access.StudentProfileLocked(h.Store, ctx); s != nil {
				classID = s.ClassID
			}
			h.Store.RUnlock()
		}

		h.Store.RLock()
		teacherClassIDs := map[string]bool{}
		parentClassIDs := map[string]bool{}
		if ctx.Role == "teacher" {
			teacherClassIDs = access.TeacherClassIDsLocked(h.Store, ctx)
			if classID != "" && !teacherClassIDs[classID] {
				h.Store.RUnlock()
				return []any{}, nil
			}
		}
		if ctx.Role == "parent" {
			children := access.ParentStudentIDsLocked(h.Store, ctx)
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && children[s.ID] {
					parentClassIDs[s.ClassID] = true
				}
			}
			if classID != "" && !parentClassIDs[classID] {
				h.Store.RUnlock()
				return []any{}, nil
			}
		}
		rows := make([]*store.LiveClass, 0)
		for _, l := range h.Store.LiveClasses {
			if l.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && l.AcademicYearID != "" && l.AcademicYearID != yearID {
				continue
			}
			if classID != "" && l.ClassID != classID {
				continue
			}
			if ctx.Role == "teacher" && !teacherClassIDs[l.ClassID] {
				continue
			}
			if ctx.Role == "parent" && !parentClassIDs[l.ClassID] {
				continue
			}
			if statusQ != "" && l.Status != statusQ {
				continue
			}
			rows = append(rows, l)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartsAt.After(rows[j].StartsAt)
		})

		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode live classes.", 500, nil))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if h.Cache != nil && h.Cache.Available() {
		w.Header().Set("X-Cache", "MISS")
	}
	if !result.Ok {
		status := http.StatusBadRequest
		if result.Error != nil && result.Error.Status != 0 {
			status = result.Error.Status
		}
		w.WriteHeader(status)
		_, _ = w.Write(bytes)
		return
	}
	_, _ = w.Write(bytes)

	if h.Cache != nil && h.Cache.Available() {
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, liveClassListCacheTTL)
	}
}

// ─── Schedule (Create) ───────────────────────────────────────────────────

type scheduleInput struct {
	ClassID         string `json:"class_id"`
	Subject         string `json:"subject"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	StartsAt        string `json:"starts_at"`
	EndsAt          string `json:"ends_at"`
	HostTeacherID   string `json:"host_teacher_id"`
	AudienceType    string `json:"audience_type"`     // CLASS or STUDENT (default: CLASS)
	TargetStudentID string `json:"target_student_id"` // optional, required when audience_type is STUDENT
}

// Schedule implements POST /api/live/classes/schedule.
// Generates a unique Jitsi room URL and saves the live class record.
//
// Permission:
//   - Teachers can only create sessions for classes assigned to them
//   - Admins can create sessions for any class
func (h *Handler) Schedule(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body scheduleInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionCreate); err != nil {
			return nil, err
		}
		startsAt, okS := api.ParseDate(body.StartsAt)
		endsAt, okE := api.ParseDate(body.EndsAt)
		if body.ClassID == "" || body.Title == "" || !okS || !okE {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id, title, starts_at, ends_at are required.", 400, nil)
		}
		if endsAt.Before(startsAt) {
			return nil, api.NewControlledError("VALIDATION_ERROR", "ends_at must be after starts_at.", 400, nil)
		}

		// TEACHER PERMISSION CHECK: Teachers can only create sessions for assigned classes
		if ctx.Role == "teacher" {
			h.Store.RLock()
			found := access.CanAccessClassLocked(h.Store, ctx, body.ClassID)
			h.Store.RUnlock()
			if !found {
				return nil, api.NewControlledError("FORBIDDEN", "You are not assigned to this class. Only assigned teachers can create sessions.", 403, nil)
			}
		}

		// AUDIENCE TYPE VALIDATION
		audienceType := body.AudienceType
		if audienceType == "" {
			audienceType = "CLASS" // Default to entire class
		}
		if audienceType != "CLASS" && audienceType != "STUDENT" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "audience_type must be CLASS or STUDENT.", 400, nil)
		}

		// SPECIFIC STUDENT VALIDATION
		targetStudentID := body.TargetStudentID
		if audienceType == "STUDENT" {
			if targetStudentID == "" {
				return nil, api.NewControlledError("VALIDATION_ERROR", "target_student_id is required when audience_type is STUDENT.", 400, nil)
			}
			// Verify the student exists and is in the selected class
			h.Store.RLock()
			studentFound := false
			for _, s := range h.Store.Students {
				if s.ID == targetStudentID && s.ClassID == body.ClassID {
					studentFound = true
					break
				}
			}
			h.Store.RUnlock()
			if !studentFound {
				return nil, api.NewControlledError("VALIDATION_ERROR", "Student not found in selected class.", 400, nil)
			}
		}

		// Generate a real, working Jitsi meeting link
		joinURL := generateJitsiURL(ctx.SchoolID)

		log.Printf("[liveclass] scheduled: school=%s title=%q audience=%s join_url=%s", ctx.SchoolID, body.Title, audienceType, joinURL)

		now := time.Now()
		row := &store.LiveClass{
			ID:              store.NewID("liv"),
			SchoolID:        ctx.SchoolID,
			AcademicYearID:  ctx.ActiveAcademicYearID,
			ClassID:         body.ClassID,
			Subject:         body.Subject,
			Title:           body.Title,
			Description:     body.Description,
			StartsAt:        startsAt,
			EndsAt:          endsAt,
			HostTeacherID:   body.HostTeacherID,
			JoinURL:         joinURL,
			Provider:        "jitsi",
			Status:          "scheduled",
			AudienceType:    audienceType,
			TargetStudentID: targetStudentID,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		h.Store.Lock()
		h.Store.LiveClasses = append(h.Store.LiveClasses, row)
		h.Store.Unlock()
		h.Save("live_classes", row)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "live_class", EntityID: row.ID, After: row,
		})
		h.invalidateList(r, ctx.SchoolID)
		return h.hydrate([]*store.LiveClass{row})[0], nil
	}))
}

// ─── Get ─────────────────────────────────────────────────────────────────

// Get implements GET /api/live/classes/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				if !access.CanAccessClassLocked(h.Store, ctx, l.ClassID) {
					return nil, api.NewControlledError("FORBIDDEN", "Access denied.", 403, nil)
				}
				return h.hydrate([]*store.LiveClass{l})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
	}))
}

// ─── Update ──────────────────────────────────────────────────────────────

// Update implements PATCH /api/live/classes/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		var found *store.LiveClass
		for _, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				found = l
				break
			}
		}
		if found == nil {
			h.Store.Unlock()
			return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
		}
		if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, found.ClassID) {
			h.Store.Unlock()
			return nil, api.NewControlledError("FORBIDDEN", "You can only update live classes for assigned classes.", 403, nil)
		}
		before := *found
		if v, ok := body["title"]; ok {
			_ = json.Unmarshal(v, &found.Title)
		}
		if v, ok := body["subject"]; ok {
			_ = json.Unmarshal(v, &found.Subject)
		}
		if v, ok := body["description"]; ok {
			_ = json.Unmarshal(v, &found.Description)
		}
		if v, ok := body["status"]; ok {
			_ = json.Unmarshal(v, &found.Status)
		}
		if v, ok := body["starts_at"]; ok {
			_ = json.Unmarshal(v, &found.StartsAt)
		}
		if v, ok := body["ends_at"]; ok {
			_ = json.Unmarshal(v, &found.EndsAt)
		}
		found.UpdatedAt = time.Now()
		snapshot := *found
		h.Store.Unlock()

		h.Save("live_classes", &snapshot)
		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "live_class", EntityID: id, Before: before, After: snapshot,
		})
		h.invalidateList(r, ctx.SchoolID)
		return h.hydrate([]*store.LiveClass{&snapshot})[0], nil
	}))
}

// ─── Delete ──────────────────────────────────────────────────────────────

// Delete implements DELETE /api/live/classes/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		var removed *store.LiveClass
		for i, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, l.ClassID) {
					h.Store.Unlock()
					return nil, api.NewControlledError("FORBIDDEN", "You can only delete live classes for assigned classes.", 403, nil)
				}
				removed = l
				h.Store.LiveClasses = append(h.Store.LiveClasses[:i], h.Store.LiveClasses[i+1:]...)
				break
			}
		}
		h.Store.Unlock()

		if removed == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
		}

		h.Save("live_classes:delete", id)
		audit.Write(h.Store, ctx, audit.Input{
			Action: "delete", EntityType: "live_class", EntityID: id, Before: *removed,
		})
		h.invalidateList(r, ctx.SchoolID)
		return map[string]any{"success": true, "id": id}, nil
	}))
}
