// Package timetable implements /api/timetable endpoints. Mirrors
// old-app/shared/services/timetable.service.ts (the CRUD subset; the
// timetable-generator helper is left out — frontend doesn't call it).
package timetable

import (
	"encoding/json"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

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
		className := ""
		if cls != nil {
			className = cls.Name
		}

		// Flatten: one record per session
		for _, session := range t.Sessions {
			teacherName := ""
			if teacher, ok := teacherByID[session.TeacherID]; ok {
				teacherName = teacher.FirstName + " " + teacher.LastName
			}
			subjectName := session.Subject
			if subjectName == "" {
				if subj, ok := subjectByID[session.SubjectID]; ok {
					subjectName = subj.Name
				}
			}

			out = append(out, map[string]any{
				"_id":           t.ID + "_" + api.FormatInt(session.Day) + "_" + api.FormatInt(session.Period),
				"class_id":      t.ClassID,
				"class_name":    className,
				"subject_id":    session.SubjectID,
				"subject_name":  subjectName,
				"teacher_id":    session.TeacherID,
				"teacher_name":  teacherName,
				"day_of_week":   session.Day,
				"period_number": session.Period,
				"start_time":    session.StartsAt,
				"end_time":      session.EndsAt,
				"room":          session.Room,
				"created_at":    t.CreatedAt,
				"updated_at":    t.UpdatedAt,
			})
		}
	}
	return out
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")

		// Student scoping: only their own class.
		if ctx.Role == "student" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
					classID = s.ClassID
					break
				}
			}
			h.Store.RUnlock()
		}

		h.Store.RLock()
		rows := make([]*store.Timetable, 0)
		for _, t := range h.Store.Timetables {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
				continue
			}
			if classID != "" && t.ClassID != classID {
				continue
			}
			rows = append(rows, t)
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].UpdatedAt.After(rows[j].UpdatedAt)
		})
		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	}))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, t := range h.Store.Timetables {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Timetable{t})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Timetable not found.", 404, nil)
	}))
}

type createInput struct {
	ClassID      string                   `json:"class_id"`
	Sessions     []store.TimetableSession `json:"sessions"`
	Status       string                   `json:"status"`
	// Single-session fields (frontend sends one session at a time)
	SubjectID    string `json:"subject_id"`
	TeacherID    string `json:"teacher_id"`
	DayOfWeek    int    `json:"day_of_week"`
	PeriodNumber int    `json:"period_number"`
	StartTime    string `json:"start_time"`
	EndTime      string `json:"end_time"`
	Room         string `json:"room"`
	Subject      string `json:"subject"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id is required.", 400, nil)
		}

		// If frontend sends single-session fields, wrap into sessions array
		sessions := body.Sessions
		if len(sessions) == 0 && (body.SubjectID != "" || body.Subject != "") {
			// Resolve subject name from ID
			subjectName := body.Subject
			if subjectName == "" && body.SubjectID != "" {
				h.Store.RLock()
				for _, s := range h.Store.Subjects {
					if s.ID == body.SubjectID {
						subjectName = s.Name
						break
					}
				}
				h.Store.RUnlock()
			}
			sessions = []store.TimetableSession{{
				Day:       body.DayOfWeek,
				Period:    body.PeriodNumber,
				StartsAt:  body.StartTime,
				EndsAt:    body.EndTime,
				SubjectID: body.SubjectID,
				Subject:   subjectName,
				TeacherID: body.TeacherID,
				Room:      body.Room,
			}}
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")
		now := time.Now()

		// Check if a timetable already exists for this class — if so, append session
		h.Store.Lock()
		defer h.Store.Unlock()

		var existing *store.Timetable
		for _, t := range h.Store.Timetables {
			if t.SchoolID == ctx.SchoolID && t.ClassID == body.ClassID {
				existing = t
				break
			}
		}

		if existing != nil {
			// Append or update sessions in existing timetable
			for _, newSess := range sessions {
				found := false
				for i, oldSess := range existing.Sessions {
					if oldSess.Day == newSess.Day && oldSess.Period == newSess.Period {
						existing.Sessions[i] = newSess
						found = true
						break
					}
				}
				if !found {
					existing.Sessions = append(existing.Sessions, newSess)
				}
			}
			existing.UpdatedAt = now
			audit.Write(h.Store, ctx, audit.Input{Action: "update", EntityType: "class", EntityID: existing.ID, After: existing, Metadata: map[string]any{"scope": "timetable"}})
			return h.hydrate([]*store.Timetable{existing})[0], nil
		}

		// Create new timetable
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
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "class", EntityID: row.ID, After: row, Metadata: map[string]any{"scope": "timetable"}})
		return h.hydrate([]*store.Timetable{row})[0], nil
	}))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, t := range h.Store.Timetables {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				before := *t
				if v, ok := body["sessions"]; ok {
					_ = json.Unmarshal(v, &t.Sessions)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &t.Status)
				}
				if v, ok := body["class_id"]; ok {
					_ = json.Unmarshal(v, &t.ClassID)
				}
				t.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "class", EntityID: id, Before: before, After: *t,
					Metadata: map[string]any{"scope": "timetable"},
				})
				return h.hydrate([]*store.Timetable{t})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Timetable not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "timetable", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, t := range h.Store.Timetables {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				before := *t
				h.Store.Timetables = append(h.Store.Timetables[:i], h.Store.Timetables[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "class", EntityID: id, Before: before,
					Metadata: map[string]any{"scope": "timetable"},
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Timetable not found.", 404, nil)
	}))
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
