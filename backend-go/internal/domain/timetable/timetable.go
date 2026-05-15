// Package timetable implements /api/timetable endpoints.
//
// Production-grade rebuild:
//   - Tolerant JSON decoding: day_of_week accepts int (1..7 ISO) OR string
//     ("Monday".."Sunday"). Accepts both flat single-session payload and
//     {sessions: [...]} array.
//   - Stable ID semantics: cells in the grid use the synthetic ID
//     "{ttID}_{day}_{period}". Update/Delete parse this and mutate just the
//     matching session, so per-period editing actually works.
//   - Server-side conflict detection (teacher / room / class) — returned
//     with a 409 envelope so the UI can render an inline warning.
//   - Postgres persistence via saveFn (parity with classes/students/etc).
//   - Redis caching (graceful degradation): list + summary with TTL,
//     pattern-invalidated on writes. Multi-tenant + academic-year-scoped
//     keys.
//   - /timetable/summary endpoint returns the admin-dashboard counters in
//     a single round trip (total classes, classes scheduled, today's
//     periods, currently-running period, free teachers, conflicts).
//
// Day-of-week canonicalization:
//   - Wire (JSON in/out): ISO weekday 1..7 (1=Monday, 7=Sunday).
//   - Storage (DB CHECK day BETWEEN 0 AND 6): JS getDay convention
//     0=Sunday..6=Saturday. Conversion is `store = iso % 7` and
//     `iso = store == 0 ? 7 : store`.
package timetable

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// Cache TTLs.
const (
	listCacheTTL    = 2 * time.Minute
	summaryCacheTTL = 60 * time.Second
)

// Handler holds the dependencies needed by all timetable endpoints.
type Handler struct {
	Store   *store.MemStore
	Cache   *cache.Client
	Persist func(table string, doc any)
}

// New constructs the timetable handler. saveFn / cache may be nil — the
// handler degrades gracefully (in-memory only).
func New(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save, Cache: c}
}

// ─── DTOs ────────────────────────────────────────────────────────────────

// dayValue is a JSON-tolerant weekday on the wire. Accepts:
//   - int        : 1..7 ISO weekday (1=Monday, 7=Sunday)
//   - "Monday".."Sunday"
//   - "1".."7"
type dayValue struct{ ISO int }

func (d *dayValue) UnmarshalJSON(b []byte) error {
	if len(b) == 0 || string(b) == "null" {
		return nil
	}
	// Try int first.
	if b[0] != '"' {
		var n int
		if err := json.Unmarshal(b, &n); err != nil {
			return fmt.Errorf("day_of_week: %w", err)
		}
		d.ISO = normalizeISO(n)
		return nil
	}
	// Try string.
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return fmt.Errorf("day_of_week: %w", err)
	}
	if iso, ok := parseDayString(s); ok {
		d.ISO = iso
		return nil
	}
	return fmt.Errorf("day_of_week: unrecognized value %q", s)
}

func parseDayString(s string) (int, bool) {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "1", "monday", "mon":
		return 1, true
	case "2", "tuesday", "tue", "tues":
		return 2, true
	case "3", "wednesday", "wed":
		return 3, true
	case "4", "thursday", "thu", "thur", "thurs":
		return 4, true
	case "5", "friday", "fri":
		return 5, true
	case "6", "saturday", "sat":
		return 6, true
	case "7", "0", "sunday", "sun":
		return 7, true
	}
	if n, err := strconv.Atoi(s); err == nil {
		return normalizeISO(n), true
	}
	return 0, false
}

// normalizeISO clamps any int to ISO 1..7. 0 → 7 (Sunday).
func normalizeISO(n int) int {
	switch {
	case n <= 0:
		return 7
	case n >= 8:
		return ((n - 1) % 7) + 1
	default:
		return n
	}
}

// isoToStore converts ISO 1..7 → store 0..6 (Sun=0..Sat=6).
func isoToStore(iso int) int { return iso % 7 }

// storeToISO converts store 0..6 → ISO 1..7.
func storeToISO(d int) int {
	if d == 0 {
		return 7
	}
	return d
}

// sessionInput is the wire shape for one session inside a sessions[] array.
type sessionInput struct {
	Day       dayValue `json:"day"`
	DayOfWeek dayValue `json:"day_of_week"`
	Period    int      `json:"period"`
	StartsAt  string   `json:"starts_at"`
	EndsAt    string   `json:"ends_at"`
	StartTime string   `json:"start_time"` // alias
	EndTime   string   `json:"end_time"`   // alias
	SubjectID string   `json:"subject_id"`
	Subject   string   `json:"subject"`
	TeacherID string   `json:"teacher_id"`
	Room      string   `json:"room"`
}

func (s sessionInput) toStore(h *Handler) store.TimetableSession {
	iso := s.Day.ISO
	if iso == 0 {
		iso = s.DayOfWeek.ISO
	}
	if iso == 0 {
		iso = 1 // default Monday
	}
	startsAt := s.StartsAt
	if startsAt == "" {
		startsAt = s.StartTime
	}
	endsAt := s.EndsAt
	if endsAt == "" {
		endsAt = s.EndTime
	}
	subjectName := s.Subject
	if subjectName == "" && s.SubjectID != "" {
		h.Store.RLock()
		for _, sub := range h.Store.Subjects {
			if sub.ID == s.SubjectID {
				subjectName = sub.Name
				break
			}
		}
		h.Store.RUnlock()
	}
	return store.TimetableSession{
		Day:       isoToStore(iso),
		Period:    s.Period,
		StartsAt:  startsAt,
		EndsAt:    endsAt,
		SubjectID: s.SubjectID,
		Subject:   subjectName,
		TeacherID: s.TeacherID,
		Room:      s.Room,
	}
}

// createInput accepts either a flat single-session payload (the form) or a
// sessions[] array (bulk).
type createInput struct {
	ClassID  string         `json:"class_id"`
	Status   string         `json:"status"`
	Sessions []sessionInput `json:"sessions"`

	// Flat single-session shortcut
	SubjectID    string   `json:"subject_id"`
	Subject      string   `json:"subject"`
	TeacherID    string   `json:"teacher_id"`
	DayOfWeek    dayValue `json:"day_of_week"`
	Day          dayValue `json:"day"`
	PeriodNumber int      `json:"period_number"`
	Period       int      `json:"period"`
	StartTime    string   `json:"start_time"`
	EndTime      string   `json:"end_time"`
	StartsAt     string   `json:"starts_at"`
	EndsAt       string   `json:"ends_at"`
	Room         string   `json:"room"`
}

func (in createInput) sessions(h *Handler) []store.TimetableSession {
	if len(in.Sessions) > 0 {
		out := make([]store.TimetableSession, 0, len(in.Sessions))
		for _, s := range in.Sessions {
			out = append(out, s.toStore(h))
		}
		return out
	}
	// Promote flat payload into a single session.
	flat := sessionInput{
		Day:       in.Day,
		DayOfWeek: in.DayOfWeek,
		Period:    or(in.Period, in.PeriodNumber),
		StartsAt:  in.StartsAt,
		EndsAt:    in.EndsAt,
		StartTime: in.StartTime,
		EndTime:   in.EndTime,
		SubjectID: in.SubjectID,
		Subject:   in.Subject,
		TeacherID: in.TeacherID,
		Room:      in.Room,
	}
	if flat.SubjectID == "" && flat.Subject == "" && flat.TeacherID == "" &&
		flat.StartsAt == "" && flat.StartTime == "" {
		return nil
	}
	return []store.TimetableSession{flat.toStore(h)}
}

func or(a, b int) int {
	if a != 0 {
		return a
	}
	return b
}

// ─── Hydration ───────────────────────────────────────────────────────────

func (h *Handler) hydrate(rows []*store.Timetable) []map[string]any {
	classByID := map[string]*store.Class{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	teacherByID := map[string]*store.Teacher{}
	for _, t := range h.Store.Teachers {
		teacherByID[t.ID] = t
	}
	subjectByID := map[string]*store.Subject{}
	for _, s := range h.Store.Subjects {
		subjectByID[s.ID] = s
	}

	out := make([]map[string]any, 0)
	for _, t := range rows {
		cls := classByID[t.ClassID]
		className, section := "", ""
		if cls != nil {
			className = cls.Name
			section = cls.Section
		}
		for _, session := range t.Sessions {
			teacherName := ""
			if teacher, ok := teacherByID[session.TeacherID]; ok {
				teacherName = strings.TrimSpace(teacher.FirstName + " " + teacher.LastName)
			}
			subjectName := session.Subject
			if subjectName == "" {
				if subj, ok := subjectByID[session.SubjectID]; ok {
					subjectName = subj.Name
				}
			}
			out = append(out, map[string]any{
				"_id":              fmt.Sprintf("%s_%d_%d", t.ID, session.Day, session.Period),
				"timetable_id":     t.ID,
				"class_id":         t.ClassID,
				"class_name":       className,
				"section":          section,
				"subject_id":       session.SubjectID,
				"subject_name":     subjectName,
				"teacher_id":       session.TeacherID,
				"teacher_name":     teacherName,
				"day_of_week":      storeToISO(session.Day),
				"period_number":   session.Period,
				"start_time":      session.StartsAt,
				"end_time":        session.EndsAt,
				"room":            session.Room,
				"created_at":      t.CreatedAt,
				"updated_at":      t.UpdatedAt,
				"academic_year_id": t.AcademicYearID,
			})
		}
	}
	return out
}

// ─── ID helpers ──────────────────────────────────────────────────────────

// parseSyntheticID splits "{ttID}_{day}_{period}" into its parts. Returns
// (ttID, day, period, isSynthetic).
func parseSyntheticID(id string) (string, int, int, bool) {
	parts := strings.Split(id, "_")
	if len(parts) < 3 {
		return id, 0, 0, false
	}
	period, err1 := strconv.Atoi(parts[len(parts)-1])
	day, err2 := strconv.Atoi(parts[len(parts)-2])
	if err1 != nil || err2 != nil {
		return id, 0, 0, false
	}
	tt := strings.Join(parts[:len(parts)-2], "_")
	return tt, day, period, true
}

// ─── List ────────────────────────────────────────────────────────────────

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	classFilter := q.Get("class_id")

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))

		// Student scoping.
		if ctx.Role == "student" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
					classFilter = s.ClassID
					break
				}
			}
			h.Store.RUnlock()
		}

		// Teacher scoping: resolve teacher profile for post-query filtering.
		var teacherProfileID string
		if ctx.Role == "teacher" {
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					teacherProfileID = t.ID
					break
				}
			}
			h.Store.RUnlock()
		}

		cacheKey := h.listKey(ctx.SchoolID, yearID, classFilter)
		if h.Cache != nil && h.Cache.Available() && !api.ParsePagination(q).Enabled {
			if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
				w.Header().Set("X-Cache", "HIT")
				var cached []map[string]any
				if json.Unmarshal(b, &cached) == nil {
					return cached, nil
				}
			}
		}

		hydrated := h.queryAndHydrate(ctx.SchoolID, yearID, classFilter)

		// Teacher scoping: filter to only periods assigned to this teacher.
		if teacherProfileID != "" {
			filtered := make([]map[string]any, 0, len(hydrated))
			for _, rec := range hydrated {
				if tid, _ := rec["teacher_id"].(string); tid == teacherProfileID {
					filtered = append(filtered, rec)
				}
			}
			hydrated = filtered
		}

		if h.Cache != nil && h.Cache.Available() && !api.ParsePagination(q).Enabled && teacherProfileID == "" {
			if b, err := json.Marshal(hydrated); err == nil {
				_ = h.Cache.Set(r.Context(), cacheKey, b, listCacheTTL)
			}
			w.Header().Set("X-Cache", "MISS")
		}

		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	}))
}

func (h *Handler) queryAndHydrate(schoolID, yearID, classFilter string) []map[string]any {
	h.Store.RLock()
	rows := make([]*store.Timetable, 0)
	for _, t := range h.Store.Timetables {
		if t.SchoolID != schoolID {
			continue
		}
		if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
			continue
		}
		if classFilter != "" && t.ClassID != classFilter {
			continue
		}
		rows = append(rows, t)
	}
	sort.SliceStable(rows, func(i, j int) bool {
		return rows[i].UpdatedAt.After(rows[j].UpdatedAt)
	})
	hydrated := h.hydrate(rows)
	h.Store.RUnlock()

	// Sort the flattened output by day then period, so the grid renders
	// deterministically regardless of insertion order.
	sort.SliceStable(hydrated, func(i, j int) bool {
		di, _ := hydrated[i]["day_of_week"].(int)
		dj, _ := hydrated[j]["day_of_week"].(int)
		if di != dj {
			return di < dj
		}
		pi, _ := hydrated[i]["period_number"].(int)
		pj, _ := hydrated[j]["period_number"].(int)
		return pi < pj
	})
	return hydrated
}

// ─── Get ─────────────────────────────────────────────────────────────────

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionView); err != nil {
			return nil, err
		}
		ttID, day, period, isSynth := parseSyntheticID(id)
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, t := range h.Store.Timetables {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if t.ID != ttID && t.ID != id {
				continue
			}
			if !isSynth {
				return h.hydrate([]*store.Timetable{t})[0], nil
			}
			for _, s := range t.Sessions {
				if s.Day == day && s.Period == period {
					// Hydrate just the matching cell.
					hydrated := h.hydrate([]*store.Timetable{
						{ID: t.ID, SchoolID: t.SchoolID, AcademicYearID: t.AcademicYearID, ClassID: t.ClassID,
							Sessions: []store.TimetableSession{s}, Status: t.Status, CreatedAt: t.CreatedAt, UpdatedAt: t.UpdatedAt},
					})
					return hydrated[0], nil
				}
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Timetable entry not found.", 404, nil)
	}))
}

// ─── Create ──────────────────────────────────────────────────────────────

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR",
			"The timetable payload could not be parsed: "+err.Error(), 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id is required.", 400, nil)
		}
		sessions := body.sessions(h)
		if len(sessions) == 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "At least one session (subject + teacher + time) is required.", 400, nil)
		}
		for i, s := range sessions {
			if s.StartsAt == "" || s.EndsAt == "" {
				return nil, api.NewControlledError("VALIDATION_ERROR",
					fmt.Sprintf("session #%d: start_time and end_time are required.", i+1), 400, nil)
			}
			if !isValidTimeRange(s.StartsAt, s.EndsAt) {
				return nil, api.NewControlledError("VALIDATION_ERROR",
					fmt.Sprintf("session #%d: end_time must be after start_time.", i+1), 400, nil)
			}
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")
		now := time.Now()

		// Conflict detection (server-side, authoritative).
		if conflicts := h.detectConflicts(ctx.SchoolID, yearID, body.ClassID, sessions, ""); len(conflicts) > 0 {
			return nil, api.NewControlledError("CONFLICT", "Schedule conflict detected.", 409, map[string]any{"conflicts": conflicts})
		}

		h.Store.Lock()
		var existing *store.Timetable
		for _, t := range h.Store.Timetables {
			if t.SchoolID == ctx.SchoolID && t.ClassID == body.ClassID {
				if yearID == "" || t.AcademicYearID == "" || t.AcademicYearID == yearID {
					existing = t
					break
				}
			}
		}
		var saved *store.Timetable
		if existing != nil {
			before := *existing
			for _, ns := range sessions {
				replaced := false
				for i, os := range existing.Sessions {
					if os.Day == ns.Day && os.Period == ns.Period {
						existing.Sessions[i] = ns
						replaced = true
						break
					}
				}
				if !replaced {
					existing.Sessions = append(existing.Sessions, ns)
				}
			}
			existing.UpdatedAt = now
			if existing.AcademicYearID == "" {
				existing.AcademicYearID = yearID
			}
			saved = existing
			h.Store.Unlock()
			audit.Write(h.Store, ctx, audit.Input{
				Action: "update", EntityType: "timetable", EntityID: existing.ID,
				Before: before, After: *existing, Metadata: map[string]any{"scope": "timetable.session"},
			})
		} else {
			row := &store.Timetable{
				ID:             store.NewID("ttb"),
				SchoolID:       ctx.SchoolID,
				AcademicYearID: yearID,
				ClassID:        body.ClassID,
				Sessions:       sessions,
				Status:         orDefault(body.Status, "active"),
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			h.Store.Timetables = append(h.Store.Timetables, row)
			saved = row
			h.Store.Unlock()
			audit.Write(h.Store, ctx, audit.Input{
				Action: "create", EntityType: "timetable", EntityID: row.ID,
				After: row, Metadata: map[string]any{"scope": "timetable"},
			})
		}

		h.Persist("timetables", saved)
		h.invalidate(r.Context(), ctx.SchoolID, yearID)

		// Return only the just-touched cells, not every session in the row.
		out := h.hydrateSessions(saved, sessions)
		if len(out) == 1 {
			return out[0], nil
		}
		return out, nil
	}))
}

func (h *Handler) hydrateSessions(t *store.Timetable, sess []store.TimetableSession) []map[string]any {
	clone := *t
	clone.Sessions = sess
	return h.hydrate([]*store.Timetable{&clone})
}

// ─── Update ──────────────────────────────────────────────────────────────

// updateInput accepts the same flexible single-session shape as createInput
// plus a sessions[] override.
type updateInput struct {
	createInput
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	var body updateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR",
			"The timetable payload could not be parsed: "+err.Error(), 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionUpdate); err != nil {
			return nil, err
		}
		ttID, day, period, isSynth := parseSyntheticID(id)
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")

		h.Store.Lock()
		var target *store.Timetable
		for _, t := range h.Store.Timetables {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if t.ID == ttID || t.ID == id {
				target = t
				break
			}
		}
		if target == nil {
			h.Store.Unlock()
			return nil, api.NewControlledError("NOT_FOUND", "Timetable entry not found.", 404, nil)
		}
		before := *target

		patch := body.sessions(h)
		if isSynth {
			// Mutate the single session matching {day, period}; if patch is
			// empty or doesn't contain a session, treat body as a partial
			// update for the existing session.
			var newSess store.TimetableSession
			if len(patch) > 0 {
				newSess = patch[0]
				newSess.Day = day // pin to the URL coordinates
				newSess.Period = period
			} else {
				// Partial update: start from the existing session and overlay.
				for _, s := range target.Sessions {
					if s.Day == day && s.Period == period {
						newSess = s
						break
					}
				}
			}
			if newSess.StartsAt != "" && newSess.EndsAt != "" && !isValidTimeRange(newSess.StartsAt, newSess.EndsAt) {
				h.Store.Unlock()
				return nil, api.NewControlledError("VALIDATION_ERROR", "end_time must be after start_time.", 400, nil)
			}
			// Conflict check (excluding self).
			if newSess.StartsAt != "" {
				h.Store.Unlock()
				if conflicts := h.detectConflicts(ctx.SchoolID, yearID, target.ClassID, []store.TimetableSession{newSess}, target.ID); len(conflicts) > 0 {
					return nil, api.NewControlledError("CONFLICT", "Schedule conflict detected.", 409, map[string]any{"conflicts": conflicts})
				}
				h.Store.Lock()
			}
			replaced := false
			for i, s := range target.Sessions {
				if s.Day == day && s.Period == period {
					target.Sessions[i] = newSess
					replaced = true
					break
				}
			}
			if !replaced {
				target.Sessions = append(target.Sessions, newSess)
			}
		} else {
			// Whole-row update (rare path).
			if body.ClassID != "" {
				target.ClassID = body.ClassID
			}
			if body.Status != "" {
				target.Status = body.Status
			}
			if len(patch) > 0 {
				target.Sessions = patch
			}
		}
		target.UpdatedAt = time.Now()
		saved := target
		h.Store.Unlock()

		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "timetable", EntityID: target.ID,
			Before: before, After: *target, Metadata: map[string]any{"scope": "timetable.session"},
		})
		h.Persist("timetables", saved)
		h.invalidate(r.Context(), ctx.SchoolID, target.AcademicYearID)

		if isSynth {
			for _, s := range saved.Sessions {
				if s.Day == day && s.Period == period {
					return h.hydrateSessions(saved, []store.TimetableSession{s})[0], nil
				}
			}
		}
		return h.hydrate([]*store.Timetable{saved})[0], nil
	}))
}

// ─── Delete ──────────────────────────────────────────────────────────────

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionDelete); err != nil {
			return nil, err
		}
		ttID, day, period, isSynth := parseSyntheticID(id)

		h.Store.Lock()
		idx := -1
		var target *store.Timetable
		for i, t := range h.Store.Timetables {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if t.ID == ttID || t.ID == id {
				target = t
				idx = i
				break
			}
		}
		if target == nil {
			h.Store.Unlock()
			return nil, api.NewControlledError("NOT_FOUND", "Timetable entry not found.", 404, nil)
		}
		before := *target

		if isSynth {
			out := target.Sessions[:0]
			removed := false
			for _, s := range target.Sessions {
				if s.Day == day && s.Period == period {
					removed = true
					continue
				}
				out = append(out, s)
			}
			target.Sessions = out
			target.UpdatedAt = time.Now()
			h.Store.Unlock()
			if !removed {
				return nil, api.NewControlledError("NOT_FOUND", "No matching session for that day and period.", 404, nil)
			}
			audit.Write(h.Store, ctx, audit.Input{
				Action: "delete", EntityType: "timetable", EntityID: target.ID,
				Before: before, After: *target, Metadata: map[string]any{"scope": "timetable.session", "day": day, "period": period},
			})
			h.Persist("timetables", target)
			h.invalidate(r.Context(), ctx.SchoolID, target.AcademicYearID)
			return map[string]any{"success": true, "id": id}, nil
		}

		// Whole-timetable delete.
		h.Store.Timetables = append(h.Store.Timetables[:idx], h.Store.Timetables[idx+1:]...)
		yearID := target.AcademicYearID
		h.Store.Unlock()
		audit.Write(h.Store, ctx, audit.Input{
			Action: "delete", EntityType: "timetable", EntityID: target.ID,
			Before: before, Metadata: map[string]any{"scope": "timetable"},
		})
		h.Persist("timetables:delete", target.ID)
		h.invalidate(r.Context(), ctx.SchoolID, yearID)
		return map[string]any{"success": true, "id": target.ID}, nil
	}))
}

// ─── Summary ─────────────────────────────────────────────────────────────

// SummaryResponse is the lightweight DTO consumed by the admin dashboard.
type SummaryResponse struct {
	TotalClasses           int              `json:"totalClasses"`
	ClassesScheduled       int              `json:"classesScheduled"`
	ClassesUnscheduled     int              `json:"classesUnscheduled"`
	TotalPeriodsToday      int              `json:"totalPeriodsToday"`
	CompletedPeriodsToday  int              `json:"completedPeriodsToday"`
	UpcomingPeriodsToday   int              `json:"upcomingPeriodsToday"`
	ActivePeriodsNow       int              `json:"activePeriodsNow"`
	TotalTeachers          int              `json:"totalTeachers"`
	TeachersTeachingNow    int              `json:"teachersTeachingNow"`
	FreeTeachersNow        int              `json:"freeTeachersNow"`
	ConflictsCount         int              `json:"conflictsCount"`
	CurrentPeriod          *map[string]any  `json:"currentPeriod,omitempty"`
	NextPeriod             *map[string]any  `json:"nextPeriod,omitempty"`
	UnscheduledClasses     []map[string]any `json:"unscheduledClasses"`
	GeneratedAt            time.Time        `json:"generatedAt"`
}

func (h *Handler) Summary(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, r.URL.Query().Get("academic_year_id"))
		key := fmt.Sprintf("tt:summary:%s:%s", ctx.SchoolID, yearID)

		if h.Cache != nil && h.Cache.Available() {
			if b, err := h.Cache.Get(r.Context(), key); err == nil && b != nil {
				w.Header().Set("X-Cache", "HIT")
				var cached SummaryResponse
				if json.Unmarshal(b, &cached) == nil {
					return cached, nil
				}
			}
		}

		s := h.computeSummary(ctx, yearID)
		if h.Cache != nil && h.Cache.Available() {
			if b, err := json.Marshal(s); err == nil {
				_ = h.Cache.Set(r.Context(), key, b, summaryCacheTTL)
			}
			w.Header().Set("X-Cache", "MISS")
		}
		return s, nil
	}))
}

func (h *Handler) computeSummary(ctx *api.RequestContext, yearID string) SummaryResponse {
	now := time.Now()
	nowMin := now.Hour()*60 + now.Minute()
	todayISO := jsToISO(int(now.Weekday())) // ISO 1..7 of "today"

	h.Store.RLock()
	defer h.Store.RUnlock()

	classByID := map[string]*store.Class{}
	totalClasses := 0
	for _, c := range h.Store.Classes {
		if c.SchoolID != ctx.SchoolID {
			continue
		}
		if yearID != "" && c.AcademicYearID != "" && c.AcademicYearID != yearID {
			continue
		}
		if c.Status == "archived" {
			continue
		}
		classByID[c.ID] = c
		totalClasses++
	}

	scheduledClasses := map[string]bool{}
	totalPeriodsToday, completedToday, upcomingToday, activeNow := 0, 0, 0, 0
	teachingNow := map[string]bool{}
	var currentPeriod, nextPeriod map[string]any
	nextStart := -1

	for _, t := range h.Store.Timetables {
		if t.SchoolID != ctx.SchoolID {
			continue
		}
		if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
			continue
		}
		if _, ok := classByID[t.ClassID]; !ok {
			continue
		}
		if len(t.Sessions) > 0 {
			scheduledClasses[t.ClassID] = true
		}
		for _, s := range t.Sessions {
			iso := storeToISO(s.Day)
			if iso != todayISO {
				continue
			}
			totalPeriodsToday++
			startMin, sok := parseTimeMinutes(s.StartsAt)
			endMin, eok := parseTimeMinutes(s.EndsAt)
			if !sok || !eok {
				continue
			}
			switch {
			case nowMin >= startMin && nowMin < endMin:
				activeNow++
				if s.TeacherID != "" {
					teachingNow[s.TeacherID] = true
				}
				if currentPeriod == nil {
					currentPeriod = h.cellSummary(t, s, classByID)
				}
			case nowMin < startMin:
				upcomingToday++
				if nextStart == -1 || startMin < nextStart {
					nextStart = startMin
					nextPeriod = h.cellSummary(t, s, classByID)
				}
			default:
				completedToday++
			}
		}
	}

	totalTeachers := 0
	for _, t := range h.Store.Teachers {
		if t.SchoolID == ctx.SchoolID && t.Status == "active" {
			totalTeachers++
		}
	}
	free := totalTeachers - len(teachingNow)
	if free < 0 {
		free = 0
	}

	conflictsCount := h.countConflicts(ctx.SchoolID, yearID)

	unscheduled := make([]map[string]any, 0)
	for cid, c := range classByID {
		if !scheduledClasses[cid] {
			unscheduled = append(unscheduled, map[string]any{
				"_id": c.ID, "name": c.Name, "section": c.Section, "grade": c.Grade,
			})
		}
	}
	sort.SliceStable(unscheduled, func(i, j int) bool {
		return fmt.Sprintf("%v", unscheduled[i]["name"]) < fmt.Sprintf("%v", unscheduled[j]["name"])
	})

	return SummaryResponse{
		TotalClasses:          totalClasses,
		ClassesScheduled:      len(scheduledClasses),
		ClassesUnscheduled:    totalClasses - len(scheduledClasses),
		TotalPeriodsToday:     totalPeriodsToday,
		CompletedPeriodsToday: completedToday,
		UpcomingPeriodsToday:  upcomingToday,
		ActivePeriodsNow:      activeNow,
		TotalTeachers:         totalTeachers,
		TeachersTeachingNow:   len(teachingNow),
		FreeTeachersNow:       free,
		ConflictsCount:        conflictsCount,
		CurrentPeriod:         ptrMap(currentPeriod),
		NextPeriod:            ptrMap(nextPeriod),
		UnscheduledClasses:    unscheduled,
		GeneratedAt:           now,
	}
}

func ptrMap(m map[string]any) *map[string]any {
	if m == nil {
		return nil
	}
	return &m
}

func (h *Handler) cellSummary(t *store.Timetable, s store.TimetableSession, classByID map[string]*store.Class) map[string]any {
	className := ""
	section := ""
	if c, ok := classByID[t.ClassID]; ok {
		className = c.Name
		section = c.Section
	}
	teacherName := ""
	for _, tc := range h.Store.Teachers {
		if tc.ID == s.TeacherID {
			teacherName = strings.TrimSpace(tc.FirstName + " " + tc.LastName)
			break
		}
	}
	subjectName := s.Subject
	if subjectName == "" {
		for _, sub := range h.Store.Subjects {
			if sub.ID == s.SubjectID {
				subjectName = sub.Name
				break
			}
		}
	}
	return map[string]any{
		"_id":           fmt.Sprintf("%s_%d_%d", t.ID, s.Day, s.Period),
		"timetable_id":  t.ID,
		"class_id":      t.ClassID,
		"class_name":    className,
		"section":       section,
		"subject_id":    s.SubjectID,
		"subject_name":  subjectName,
		"teacher_id":    s.TeacherID,
		"teacher_name":  teacherName,
		"day_of_week":   storeToISO(s.Day),
		"period_number": s.Period,
		"start_time":    s.StartsAt,
		"end_time":      s.EndsAt,
		"room":          s.Room,
	}
}

// jsToISO converts JS getDay()-style 0..6 (Sun=0..Sat=6) to ISO 1..7
// (Mon=1..Sun=7).
func jsToISO(jsDay int) int {
	if jsDay == 0 {
		return 7
	}
	return jsDay
}

// ─── Conflicts ───────────────────────────────────────────────────────────

// Conflict is one detected scheduling collision.
type Conflict struct {
	Type           string `json:"type"` // "teacher" | "room" | "class"
	Day            int    `json:"day_of_week"`
	Period         int    `json:"period_number"`
	StartTime      string `json:"start_time"`
	EndTime        string `json:"end_time"`
	ClassID        string `json:"class_id,omitempty"`
	ClassName      string `json:"class_name,omitempty"`
	TeacherID      string `json:"teacher_id,omitempty"`
	Room           string `json:"room,omitempty"`
	ExistingTimetableID string `json:"existing_timetable_id,omitempty"`
	Message        string `json:"message"`
}

// detectConflicts checks each candidate session against the rest of the
// schedule for the same school/year. excludeTimetableID skips a parent row
// (used on update so a session doesn't conflict with itself).
func (h *Handler) detectConflicts(schoolID, yearID, classID string, candidates []store.TimetableSession, excludeTimetableID string) []Conflict {
	h.Store.RLock()
	defer h.Store.RUnlock()

	out := make([]Conflict, 0)
	classByID := map[string]string{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c.Name
	}

	for _, c := range candidates {
		cStart, cStartOK := parseTimeMinutes(c.StartsAt)
		cEnd, cEndOK := parseTimeMinutes(c.EndsAt)
		if !cStartOK || !cEndOK || cEnd <= cStart {
			continue
		}
		for _, t := range h.Store.Timetables {
			if t.SchoolID != schoolID {
				continue
			}
			if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
				continue
			}
			if t.ID == excludeTimetableID && t.ClassID == classID {
				// Same row: only conflict against OTHER cells of itself if
				// they overlap, but skip identical (day, period) cell.
			}
			for _, s := range t.Sessions {
				if s.Day != c.Day {
					continue
				}
				// Skip the same exact slot we're updating (same parent + same coords).
				if t.ID == excludeTimetableID && t.ClassID == classID && s.Period == c.Period {
					continue
				}
				sStart, ok1 := parseTimeMinutes(s.StartsAt)
				sEnd, ok2 := parseTimeMinutes(s.EndsAt)
				if !ok1 || !ok2 {
					continue
				}
				if cStart < sEnd && cEnd > sStart {
					iso := storeToISO(c.Day)
					if t.ClassID == classID {
						out = append(out, Conflict{
							Type: "class", Day: iso, Period: c.Period,
							StartTime: c.StartsAt, EndTime: c.EndsAt,
							ClassID: t.ClassID, ClassName: classByID[t.ClassID],
							ExistingTimetableID: t.ID,
							Message: fmt.Sprintf("This class already has a period at %s–%s.", s.StartsAt, s.EndsAt),
						})
					}
					if c.TeacherID != "" && c.TeacherID == s.TeacherID {
						out = append(out, Conflict{
							Type: "teacher", Day: iso, Period: c.Period,
							StartTime: c.StartsAt, EndTime: c.EndsAt,
							ClassID: t.ClassID, ClassName: classByID[t.ClassID],
							TeacherID: s.TeacherID, ExistingTimetableID: t.ID,
							Message: fmt.Sprintf("Teacher is already booked for %s at %s–%s.", classByID[t.ClassID], s.StartsAt, s.EndsAt),
						})
					}
					if c.Room != "" && c.Room == s.Room {
						out = append(out, Conflict{
							Type: "room", Day: iso, Period: c.Period,
							StartTime: c.StartsAt, EndTime: c.EndsAt,
							ClassID: t.ClassID, ClassName: classByID[t.ClassID],
							Room: s.Room, ExistingTimetableID: t.ID,
							Message: fmt.Sprintf("Room %s is occupied by %s at %s–%s.", s.Room, classByID[t.ClassID], s.StartsAt, s.EndsAt),
						})
					}
				}
			}
		}
	}
	return out
}

func (h *Handler) countConflicts(schoolID, yearID string) int {
	type cell struct{ tt *store.Timetable; s store.TimetableSession }
	h.Store.RLock()
	defer h.Store.RUnlock()
	cells := make([]cell, 0)
	for _, t := range h.Store.Timetables {
		if t.SchoolID != schoolID {
			continue
		}
		if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
			continue
		}
		for _, s := range t.Sessions {
			cells = append(cells, cell{tt: t, s: s})
		}
	}
	count := 0
	for i := 0; i < len(cells); i++ {
		ai, aok := parseTimeMinutes(cells[i].s.StartsAt)
		aj, bok := parseTimeMinutes(cells[i].s.EndsAt)
		if !aok || !bok {
			continue
		}
		conflicted := false
		for j := i + 1; j < len(cells); j++ {
			if cells[j].s.Day != cells[i].s.Day {
				continue
			}
			bi, ok1 := parseTimeMinutes(cells[j].s.StartsAt)
			bj, ok2 := parseTimeMinutes(cells[j].s.EndsAt)
			if !ok1 || !ok2 {
				continue
			}
			if ai < bj && aj > bi {
				if cells[i].tt.ClassID == cells[j].tt.ClassID ||
					(cells[i].s.TeacherID != "" && cells[i].s.TeacherID == cells[j].s.TeacherID) ||
					(cells[i].s.Room != "" && cells[i].s.Room == cells[j].s.Room) {
					conflicted = true
					break
				}
			}
		}
		if conflicted {
			count++
		}
	}
	return count
}

// ─── Helpers ─────────────────────────────────────────────────────────────

func parseTimeMinutes(t string) (int, bool) {
	t = strings.TrimSpace(t)
	if len(t) < 4 {
		return 0, false
	}
	parts := strings.Split(t, ":")
	if len(parts) < 2 {
		return 0, false
	}
	hh, err := strconv.Atoi(parts[0])
	if err != nil || hh < 0 || hh > 23 {
		return 0, false
	}
	mm, err := strconv.Atoi(parts[1])
	if err != nil || mm < 0 || mm > 59 {
		return 0, false
	}
	return hh*60 + mm, true
}

func isValidTimeRange(start, end string) bool {
	s, ok1 := parseTimeMinutes(start)
	e, ok2 := parseTimeMinutes(end)
	return ok1 && ok2 && e > s
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}

func (h *Handler) listKey(schoolID, yearID, classID string) string {
	if classID == "" {
		classID = "all"
	}
	return fmt.Sprintf("tt:list:%s:%s:%s", schoolID, yearID, classID)
}

// invalidate clears all cached views derived from a school's timetable.
func (h *Handler) invalidate(ctx context.Context, schoolID, yearID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	pattern := fmt.Sprintf("tt:list:%s:%s:*", schoolID, yearID)
	if _, err := h.Cache.DelPattern(ctx, pattern); err != nil {
		log.Printf("[timetable] invalidate %s failed: %v", pattern, err)
	}
	if _, err := h.Cache.Del(ctx, fmt.Sprintf("tt:summary:%s:%s", schoolID, yearID)); err != nil {
		log.Printf("[timetable] summary invalidate failed: %v", err)
	}
}
