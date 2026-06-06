// Package teachers implements /api/teachers endpoints.
package teachers

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/repo"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// teachersGetCacheTTL — short window for teacher dashboard aggregator.
// Aggregator joins classes, students, attendance, homework, exams,
// timetables, announcements; even on warm caches it's cheap enough at
// 30s to give a near-realtime feel while removing cross-table fan-out
// on every page-render.
const teachersGetCacheTTL = 30 * time.Second

// getCacheKey is per-teacher (the response is teacher-scoped).
func getCacheKey(schoolID, teacherID string) string {
	return fmt.Sprintf("teachers:get:%s:%s", schoolID, teacherID)
}

// teachersListCacheTTL — short window so newly created/updated teachers
// surface quickly. Same TTL as other phase-8 list caches.
const teachersListCacheTTL = 60 * time.Second

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Pool    *pgxpool.Pool
	Cache   *cache.Client
	repo    *repo.TeacherRepo
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

func NewPG(s *store.MemStore, save func(string, any), pool *pgxpool.Pool, c *cache.Client) *Handler {
	h := New(s, save)
	h.Pool = pool
	h.Cache = c
	if pool != nil {
		h.repo = repo.NewTeacherRepo(pool, c)
	}
	return h
}

// listCacheKey hashes filter inputs for a stable per-tenant key.
// Role is part of the key since teachers/admins may see different data
// once row-level scoping is introduced.
func listCacheKey(schoolID, role, query string) string {
	src := fmt.Sprintf("%s|%s|%s", schoolID, role, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("teachers:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateCaches(ctx context.Context, schoolID, yearID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(ctx, fmt.Sprintf("teachers:%s:*", schoolID))
	_, _ = h.Cache.DelPattern(ctx, fmt.Sprintf("teachers:list:%s:*", schoolID))
	_, _ = h.Cache.Del(ctx,
		fmt.Sprintf("composite:%s:%s", schoolID, yearID),
		fmt.Sprintf("dash:%s:%s", schoolID, yearID),
	)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	if ctx == nil {
		api.WriteResult(w, api.Fail("UNAUTHENTICATED", "Authentication required.", 401, nil))
		return
	}

	if err := auth.AssertPermission(ctx, "teachers", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	q := r.URL.Query()
	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, q.Encode())
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
		status := q.Get("status")
		search := strings.TrimSpace(q.Get("search"))
		pagination := api.ParsePagination(q)

		if h.repo != nil && pagination.Enabled {
			items, total, err := h.repo.List(r.Context(), ctx.SchoolID, yearID, repo.ListOpts{
				Page:    pagination.Page,
				PerPage: pagination.Limit,
				Status:  status,
				Search:  search,
			})
			// If we got results, or we are on a page > 1, or there was a real error, use PG.
			// But if page 1 is empty, we fall through to MemStore to catch unpersisted new items.
			if err == nil && (len(items) > 0 || pagination.Page > 1) {
				h.Store.RLock()
				memByID := make(map[string]*store.Teacher, len(h.Store.Teachers))
				for _, t := range h.Store.Teachers {
					if t.SchoolID == ctx.SchoolID {
						memByID[t.ID] = t
					}
				}
				h.Store.RUnlock()

				hydrated := make([]map[string]any, 0, len(items))
				for i := range items {
					t := items[i]
					mem := memByID[t.ID]
					hydrated = append(hydrated, h.hydrateTeacher(&t, mem))
				}
				return api.BuildPaginated(hydrated, total, pagination), nil
			}
		}

		h.Store.RLock()
		rows := make([]*store.Teacher, 0)
		for _, t := range h.Store.Teachers {
			if t.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
				continue
			}
			if status != "" && t.Status != status {
				continue
			}
			if search != "" && !teacherMatchesSearch(t, search) {
				continue
			}
			rows = append(rows, t)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			if rows[i].FirstName == rows[j].FirstName {
				return rows[i].LastName < rows[j].LastName
			}
			return rows[i].FirstName < rows[j].FirstName
		})

		hydrated := make([]map[string]any, 0, len(rows))
		for _, t := range rows {
			hydrated = append(hydrated, h.hydrateTeacher(t, t))
		}

		if !pagination.Enabled {
			return hydrated, nil
		}
		total := len(hydrated)
		start := pagination.Skip
		end := start + pagination.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		return api.BuildPaginated(hydrated[start:end], total, pagination), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode teachers.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, teachersListCacheTTL)
	}
}

func (h *Handler) hydrateTeacher(pgRow *store.Teacher, mem *store.Teacher) map[string]any {
	out := map[string]any{
		"id":               pgRow.ID,
		"_id":              pgRow.ID,
		"employee_no":      pgRow.EmployeeNo,
		"first_name":       pgRow.FirstName,
		"last_name":        pgRow.LastName,
		"email":            pgRow.Email,
		"phone":            pgRow.Phone,
		"qualification":    pgRow.Qualification,
		"status":           pgRow.Status,
		"joined_at":        pgRow.JoinedAt,
		"academic_year_id": pgRow.AcademicYearID,
		"user_id":          pgRow.UserID,
		"subjects":         orEmpty(pgRow.Subjects),
		"subject_ids":      orEmpty(pgRow.SubjectIDs),
		"class_ids":        orEmpty(pgRow.ClassIDs),
	}
	if mem != nil {
		out["subjects"] = orEmpty(mem.Subjects)
		out["subject_ids"] = orEmpty(mem.SubjectIDs)
		out["class_ids"] = orEmpty(mem.ClassIDs)
		if mem.UserID != "" {
			out["user_id"] = mem.UserID
		}
		if !mem.JoinedAt.IsZero() {
			out["joined_at"] = mem.JoinedAt
		}
	}
	return out
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")

	if err := auth.AssertPermission(ctx, "teachers", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	// Resolve target teacher first (cheap; needed to compute cache key).
	var teacher *store.Teacher
	if id == "session" || id == "me" {
		h.Store.RLock()
		for _, t := range h.Store.Teachers {
			if t.UserID == ctx.UserID && t.SchoolID == ctx.SchoolID {
				teacher = t
				break
			}
		}
		h.Store.RUnlock()

		if teacher == nil && h.repo != nil {
			if t, err := h.repo.GetByUserID(r.Context(), ctx.UserID, ctx.SchoolID); err == nil && t != nil {
				teacher = t
			}
		}
	} else {
		h.Store.RLock()
		for _, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				teacher = t
				break
			}
		}
		h.Store.RUnlock()

		if teacher == nil && h.repo != nil {
			if t, err := h.repo.GetByID(r.Context(), id, ctx.SchoolID); err == nil && t != nil {
				teacher = t
			}
		}
	}

	if teacher == nil {
		api.WriteResult(w, api.Fail("NOT_FOUND", "Teacher not found.", 404, nil))
		return
	}

	cacheKey := getCacheKey(ctx.SchoolID, teacher.ID)
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		return h.getTeacherPortalData(ctx, teacher), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode teacher portal data.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, teachersGetCacheTTL)
	}
}

func (h *Handler) getTeacherPortalData(ctx *api.RequestContext, teacher *store.Teacher) map[string]any {
	h.Store.RLock()
	defer h.Store.RUnlock()

	schoolName := "Eduplexo Academy"
	currentSession := "2025-26"
	for _, s := range h.Store.Schools {
		if s.SchoolID == ctx.SchoolID {
			schoolName = s.Name
			break
		}
	}
	for _, ay := range h.Store.AcademicYears {
		if ay.SchoolID == ctx.SchoolID && ay.IsActive {
			currentSession = ay.Year
			break
		}
	}

	portalClasses := make([]map[string]any, 0)
	teacherClassesMap := make(map[string]bool)
	for _, cID := range teacher.ClassIDs {
		teacherClassesMap[cID] = true
	}

	todayStart, todayEnd := api.DayBounds(time.Now())
	attendanceMarkedMap := make(map[string]bool)
	for _, a := range h.Store.Attendance {
		if a.SchoolID == ctx.SchoolID && !a.Date.Before(todayStart) && !a.Date.After(todayEnd) {
			attendanceMarkedMap[a.ClassID] = true
		}
	}

	totalStudents := 0
	todayLectures := 0
	upcomingExamsCount := 0
	weekday := int(time.Now().Weekday())

	for _, c := range h.Store.Classes {
		isAssigned := teacherClassesMap[c.ID]
		if !isAssigned {
			if c.ClassTeacherID == teacher.ID {
				isAssigned = true
			} else {
				for _, tID := range c.TeacherIDs {
					if tID == teacher.ID {
						isAssigned = true
						break
					}
				}
			}
		}

		if c.SchoolID == ctx.SchoolID && isAssigned {
			totalStudents += c.StudentCount
			pendingHW := 0
			for _, hw := range h.Store.Homework {
				if hw.ClassID == c.ID && hw.Status == "assigned" {
					pendingHW++
				}
			}
			examsInClass := 0
			now := time.Now()
			for _, ex := range h.Store.Exams {
				if ex.ClassID == c.ID && ex.StartsAt.After(now) {
					examsInClass++
					upcomingExamsCount++
				}
			}
			lecturesToday := 0
			for _, tt := range h.Store.Timetables {
				if tt.ClassID == c.ID {
					for _, s := range tt.Sessions {
						if s.Day == weekday && s.TeacherID == teacher.ID {
							lecturesToday++
							todayLectures++
						}
					}
				}
			}
			preview := make([]map[string]any, 0)
			for _, s := range h.Store.Students {
				if s.ClassID == c.ID && s.Status == "active" {
					preview = append(preview, map[string]any{"id": s.ID, "name": s.FirstName + " " + s.LastName})
					if len(preview) >= 5 {
						break
					}
				}
			}

			portalClasses = append(portalClasses, map[string]any{
				"id":                  c.ID,
				"name":                c.Name,
				"section":             c.Section,
				"capacity":            c.Capacity,
				"studentCount":        c.StudentCount,
				"enrolled_students":   c.StudentCount,
				"pendingHomework":    pendingHW,
				"pending_assignments": pendingHW,
				"upcomingExams":      examsInClass,
				"upcoming_exams":     examsInClass,
				"lectures_today":      lecturesToday,
				"attendance_pending":  !attendanceMarkedMap[c.ID],
				"academicYear":        currentSession,
				"academic_year":       currentSession,
				"students_preview":    preview,
			})
		}
	}

	todaySchedule := make([]map[string]any, 0)
	for _, tt := range h.Store.Timetables {
		if tt.SchoolID == ctx.SchoolID {
			className := tt.ClassID
			classSection := ""
			for _, c := range h.Store.Classes {
				if c.ID == tt.ClassID {
					className = c.Name
					classSection = c.Section
					break
				}
			}
			for _, s := range tt.Sessions {
				if s.Day == weekday && s.TeacherID == teacher.ID {
					todaySchedule = append(todaySchedule, map[string]any{
						"id":                tt.ID + "_" + fmt.Sprint(s.Period),
						"start_time":        s.StartsAt,
						"end_time":          s.EndsAt,
						"class_name":        className + " " + classSection,
						"subject_name":      s.Subject,
						"room":              s.Room,
						"attendance_marked": attendanceMarkedMap[tt.ClassID],
					})
				}
			}
		}
	}
	
	pendingGrading := 0
	for _, ex := range h.Store.Exams {
		if ex.TeacherID == teacher.ID && ex.Status == "completed" {
			pendingGrading++
		}
	}
	
	pendingHWReviews := 0
	for _, hw := range h.Store.Homework {
		if hw.TeacherID == teacher.ID && hw.Status == "assigned" {
			pendingHWReviews++
		}
	}

	markedStudentsToday := 0
	for _, a := range h.Store.Attendance {
		if a.SchoolID == ctx.SchoolID && !a.Date.Before(todayStart) && !a.Date.After(todayEnd) {
			if teacherClassesMap[a.ClassID] {
				markedStudentsToday++
			}
		}
	}

	portalAnnouncements := make([]map[string]any, 0)
	for _, an := range h.Store.Announcements {
		if an.SchoolID == ctx.SchoolID && (an.Audience == "all" || an.Audience == "teachers") {
			portalAnnouncements = append(portalAnnouncements, map[string]any{
				"id":          an.ID,
				"title":       an.Title,
				"message":     an.Body,
				"content":     an.Body,
				"date":        an.CreatedAt,
				"posted_date": an.CreatedAt,
				"priority":    an.Priority,
			})
		}
	}
	sort.SliceStable(portalAnnouncements, func(i, j int) bool {
		return portalAnnouncements[i]["date"].(time.Time).After(portalAnnouncements[j]["date"].(time.Time))
	})
	if len(portalAnnouncements) > 5 {
		portalAnnouncements = portalAnnouncements[:5]
	}

	return map[string]any{
		"teacher": h.hydrateTeacher(teacher, teacher),
		"school": map[string]any{
			"name":    schoolName,
			"session": currentSession,
		},
		"alerts": []map[string]any{},
		"operationalStats": map[string]any{
			"todayAttendance": map[string]any{
				"total":  totalStudents,
				"marked": markedStudentsToday,
			},
			"pendingGrading": pendingGrading,
			"homeworkStatus": map[string]any{
				"pending": pendingHWReviews,
			},
		},
		"stats": map[string]any{
			"totalClasses":      len(portalClasses),
			"totalStudents":     totalStudents,
			"pendingAttendance": len(portalClasses) - len(attendanceMarkedMap),
			"todayLectures":     todayLectures,
			"upcomingExams":    upcomingExamsCount,
		},
		"classes":       portalClasses,
		"todaySchedule": todaySchedule,
		"announcements": portalAnnouncements,
	}
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Teacher, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionCreate); err != nil {
			return nil, err
		}
		body.Email = strings.ToLower(strings.TrimSpace(body.Email))
		if body.Email == "" || body.FirstName == "" || body.Phone == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "email, first_name and phone are required.", 400, nil)
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, "")
		h.Store.Lock()
		for _, u := range h.Store.Users {
			if strings.EqualFold(u.Email, body.Email) {
				h.Store.Unlock()
				return nil, api.NewControlledError("DUPLICATE", "This email is already registered in the system.", 400, nil)
			}
		}
		now := time.Now()
		var userID string
		if body.Password != "" {
			hash, _ := auth.HashPassword(body.Password)
			userID = store.NewID("usr")
			h.Store.Users = append(h.Store.Users, &store.User{
				ID: userID, SchoolID: ctx.SchoolID, Email: body.Email, PasswordHash: hash, Role: "teacher", 
				Permissions: []string{"teacher:basic"},
				Status: "active",
				Profile: store.UserProfile{FirstName: body.FirstName, LastName: body.LastName, Phone: body.Phone},
				CreatedAt: now, UpdatedAt: now,
			})
			h.Persist("users", h.Store.Users[len(h.Store.Users)-1])
		}
		count := 0
		for _, t := range h.Store.Teachers {
			if t.SchoolID == ctx.SchoolID {
				count++
			}
		}
		newTeacher := &store.Teacher{
			ID: store.NewID("tch"), SchoolID: ctx.SchoolID, AcademicYearID: yearID, UserID: userID, Email: body.Email,
			EmployeeNo: "TCH-" + padLeft(count+1, 4), FirstName: body.FirstName, LastName: body.LastName, Phone: body.Phone,
			Qualification: body.Qualification, SubjectIDs: orEmpty(body.SubjectIDs), Subjects: orEmpty(body.Subjects),
			ClassIDs: orEmpty(body.ClassIDs), Status: "active", JoinedAt: now, CreatedAt: now, UpdatedAt: now,
		}
		h.Store.Teachers = append(h.Store.Teachers, newTeacher)
		h.Store.Unlock()
		h.Persist("teachers", newTeacher)
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "teacher", EntityID: newTeacher.ID, After: newTeacher})

		// Direct PG write so the immediate frontend refetch (which
		// hits the PG paginated path) sees the new row without waiting
		// for the background flush queue. The Persist call above is kept
		// as belt-and-suspenders — the upsert is idempotent.
		if h.Pool != nil {
			_, _ = h.Pool.Exec(r.Context(), `
				INSERT INTO teachers (id, school_id, academic_year_id, user_id, email,
					employee_no, first_name, last_name, phone, qualification,
					subject_ids, subjects, class_ids, status, joined_at,
					created_at, updated_at)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
				ON CONFLICT (id) DO NOTHING
			`, newTeacher.ID, newTeacher.SchoolID, newTeacher.AcademicYearID,
				newTeacher.UserID, newTeacher.Email,
				newTeacher.EmployeeNo, newTeacher.FirstName, newTeacher.LastName,
				newTeacher.Phone, newTeacher.Qualification,
				newTeacher.SubjectIDs, newTeacher.Subjects, newTeacher.ClassIDs,
				newTeacher.Status, newTeacher.JoinedAt, newTeacher.CreatedAt, newTeacher.UpdatedAt)
		}

		h.invalidateCaches(r.Context(), ctx.SchoolID, yearID)
		return newTeacher, nil
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
	api.WriteResult(w, api.ServiceTry(func() (*store.Teacher, error) {
		// Allow self-update: teachers can update their own profile
		isSelfUpdate := false
		if ctx.Role == "teacher" {
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.ID == id && t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					isSelfUpdate = true
					break
				}
			}
			h.Store.RUnlock()
		}
		if !isSelfUpdate {
			if err := auth.AssertPermission(ctx, "teachers", auth.ActionUpdate); err != nil {
				return nil, err
			}
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				if v, ok := body["first_name"]; ok { _ = json.Unmarshal(v, &t.FirstName) }
				if v, ok := body["last_name"]; ok { _ = json.Unmarshal(v, &t.LastName) }
				if v, ok := body["phone"]; ok { _ = json.Unmarshal(v, &t.Phone) }
				if v, ok := body["qualification"]; ok { _ = json.Unmarshal(v, &t.Qualification) }
				if v, ok := body["status"]; ok { _ = json.Unmarshal(v, &t.Status) }
				if v, ok := body["subjects"]; ok { _ = json.Unmarshal(v, &t.Subjects) }
				if v, ok := body["subject_ids"]; ok { _ = json.Unmarshal(v, &t.SubjectIDs) }
				if v, ok := body["class_ids"]; ok { _ = json.Unmarshal(v, &t.ClassIDs) }

				var emailStr string
				var emailUpdated bool
				if v, ok := body["email"]; ok {
					_ = json.Unmarshal(v, &emailStr)
					emailStr = strings.ToLower(strings.TrimSpace(emailStr))
					if emailStr != "" && emailStr != t.Email {
						t.Email = emailStr
						emailUpdated = true
					}
				}

				var newPassword string
				if v, ok := body["password"]; ok {
					_ = json.Unmarshal(v, &newPassword)
				}

				// Synchronize User profile/password if linked User exists
				var user *store.User
				if t.UserID != "" {
					for _, u := range h.Store.Users {
						if u.ID == t.UserID && u.SchoolID == ctx.SchoolID {
							user = u
							break
						}
					}
				}

				if user != nil {
					if emailUpdated {
						user.Email = t.Email
					}
					if v, ok := body["first_name"]; ok { _ = json.Unmarshal(v, &user.Profile.FirstName) }
					if v, ok := body["last_name"]; ok { _ = json.Unmarshal(v, &user.Profile.LastName) }
					if v, ok := body["phone"]; ok { _ = json.Unmarshal(v, &user.Profile.Phone) }
					if newPassword != "" {
						hash, _ := auth.HashPassword(newPassword)
						user.PasswordHash = hash
					}
					user.UpdatedAt = time.Now()
					h.Persist("users", user)

					// Direct user PG update if Pool exists
					if h.Pool != nil {
						_, _ = h.Pool.Exec(r.Context(), `
							UPDATE users SET email=$3, password_hash=$4, profile_first=$5, profile_last=$6, profile_phone=$7, updated_at=$8
							WHERE id=$1 AND school_id=$2
						`, user.ID, user.SchoolID, user.Email, user.PasswordHash, user.Profile.FirstName, user.Profile.LastName, user.Profile.Phone, user.UpdatedAt)
					}
				} else if newPassword != "" && t.Email != "" {
					// Create user if they didn't have one and a password was supplied
					hash, _ := auth.HashPassword(newPassword)
					userID := store.NewID("usr")
					user = &store.User{
						ID: userID, SchoolID: ctx.SchoolID, Email: t.Email, PasswordHash: hash, Role: "teacher",
						Permissions: []string{"teacher:basic"},
						Status: "active",
						Profile: store.UserProfile{FirstName: t.FirstName, LastName: t.LastName, Phone: t.Phone},
						CreatedAt: time.Now(), UpdatedAt: time.Now(),
					}
					h.Store.Users = append(h.Store.Users, user)
					h.Persist("users", user)
					t.UserID = userID

					// Direct user PG insert if Pool exists
					if h.Pool != nil {
						_, _ = h.Pool.Exec(r.Context(), `
							INSERT INTO users (id, school_id, email, password_hash, role, permissions, status, profile_first, profile_last, profile_phone, created_at, updated_at)
							VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
						`, user.ID, user.SchoolID, user.Email, user.PasswordHash, user.Role, user.Permissions, user.Status, user.Profile.FirstName, user.Profile.LastName, user.Profile.Phone, user.CreatedAt, user.UpdatedAt)
					}
				}

				t.UpdatedAt = time.Now()
				h.Persist("teachers", t)

				// Direct teacher + junction tables PG updates if Pool exists
				if h.Pool != nil {
					_, _ = h.Pool.Exec(r.Context(), `
						UPDATE teachers SET first_name=$3, last_name=$4, email=$5, phone=$6,
						       qualification=$7, status=$8, user_id=$9, updated_at=$10
						WHERE id=$1 AND school_id=$2
					`, t.ID, t.SchoolID, t.FirstName, t.LastName, t.Email, t.Phone,
						t.Qualification, t.Status, t.UserID, t.UpdatedAt)

					// Direct update of junction tables
					_, _ = h.Pool.Exec(r.Context(), `DELETE FROM teacher_subjects WHERE teacher_id=$1`, t.ID)
					for _, sid := range t.SubjectIDs {
						if sid != "" {
							_, _ = h.Pool.Exec(r.Context(), `INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, t.ID, sid)
						}
					}
					_, _ = h.Pool.Exec(r.Context(), `DELETE FROM teacher_classes WHERE teacher_id=$1`, t.ID)
					for _, cid := range t.ClassIDs {
						if cid != "" {
							_, _ = h.Pool.Exec(r.Context(), `INSERT INTO teacher_classes (teacher_id, class_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, t.ID, cid)
						}
					}
				}

				h.invalidateCaches(context.Background(), t.SchoolID, t.AcademicYearID)
				return t, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Teacher not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "teachers", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, t := range h.Store.Teachers {
			if t.ID == id && t.SchoolID == ctx.SchoolID {
				before := *t
				h.Store.Teachers = append(h.Store.Teachers[:i], h.Store.Teachers[i+1:]...)
				h.Persist("teachers:delete", before.ID)
				h.invalidateCaches(context.Background(), ctx.SchoolID, before.AcademicYearID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Teacher not found.", 404, nil)
	}))
}

type createInput struct {
	Email         string   `json:"email"`
	Password      string   `json:"password"`
	FirstName     string   `json:"first_name"`
	LastName      string   `json:"last_name"`
	Phone         string   `json:"phone"`
	Qualification string   `json:"qualification,omitempty"`
	SubjectIDs    []string `json:"subject_ids,omitempty"`
	Subjects      []string `json:"subjects,omitempty"`
	ClassIDs      []string `json:"class_ids,omitempty"`
}

func teacherMatchesSearch(t *store.Teacher, term string) bool {
	q := strings.ToLower(term)
	full := strings.ToLower(t.FirstName + " " + t.LastName)
	return strings.Contains(full, q) || strings.Contains(strings.ToLower(t.Email), q)
}

func padLeft(n, width int) string {
	s := ""
	for n > 0 { s = string(rune("0123456789"[n%10])) + s; n /= 10 }
	for len(s) < width { s = "0" + s }
	return s
}

func orEmpty(in []string) []string {
	if in == nil { return []string{} }
	return in
}
