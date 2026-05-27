package timetable

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newHandler(t *testing.T) (*Handler, *store.MemStore) {
	t.Helper()
	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{
			ID: "ay_2025", SchoolID: "school_1", IsActive: true, Status: "active",
		}},
		Classes: []*store.Class{
			{ID: "cls_1", SchoolID: "school_1", AcademicYearID: "ay_2025", Name: "Grade 5", Section: "A", Status: "active"},
		},
		Subjects: []*store.Subject{{ID: "sub_math", SchoolID: "school_1", Name: "Math"}},
		Teachers: []*store.Teacher{{ID: "tch_1", SchoolID: "school_1", FirstName: "Aisha", LastName: "K", Status: "active"}},
	}
	return New(s, nil, nil), s
}

func adminCtx(r *http.Request) *http.Request {
	return r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
		SchoolID:             "school_1",
		UserID:               "user_1",
		Role:                 "admin",
		Permissions:          []string{"*"},
		ActiveAcademicYearID: "ay_2025",
	}))
}

// ── Bug regression: previously the form sent `day_of_week: "Monday"`
// (string), the Go handler decoded into int, and json.Decoder failed
// with "Invalid JSON body". The new handler must accept both shapes.

func TestCreate_DayOfWeek_AcceptsString(t *testing.T) {
	h, _ := newHandler(t)
	body := `{
		"class_id":"cls_1","subject_id":"sub_math","teacher_id":"tch_1",
		"day_of_week":"Monday","period_number":1,
		"start_time":"08:00","end_time":"08:45","room":"R-1"
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	assert.True(t, got.Ok)
}

func TestCreate_DayOfWeek_AcceptsNumberISO(t *testing.T) {
	h, _ := newHandler(t)
	body := `{
		"class_id":"cls_1","subject_id":"sub_math","teacher_id":"tch_1",
		"day_of_week":1,"period_number":1,
		"start_time":"08:00","end_time":"08:45"
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	assert.True(t, got.Ok)

	// Hydration must report ISO 1..7 on the wire.
	rec := got.Data.(map[string]any)
	assert.EqualValues(t, 1, rec["day_of_week"])
	assert.EqualValues(t, 1, rec["period_number"])
}

func TestCreate_RejectsInvalidTimeRange(t *testing.T) {
	h, _ := newHandler(t)
	body := `{
		"class_id":"cls_1","subject_id":"sub_math","teacher_id":"tch_1",
		"day_of_week":1,"period_number":1,
		"start_time":"09:00","end_time":"08:00"
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	assert.Equal(t, http.StatusBadRequest, w.Code)
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	assert.False(t, got.Ok)
	assert.Equal(t, "VALIDATION_ERROR", got.Error.Code)
}

func TestCreate_DetectsTeacherConflict(t *testing.T) {
	h, s := newHandler(t)
	// Seed an existing period: teacher tch_1 is busy 08:00–09:00 on Monday in cls_1.
	s.Timetables = append(s.Timetables, &store.Timetable{
		ID:             "ttb_existing",
		SchoolID:       "school_1",
		AcademicYearID: "ay_2025",
		ClassID:        "cls_1",
		Sessions: []store.TimetableSession{{
			Day: 1, Period: 1, StartsAt: "08:00", EndsAt: "09:00",
			SubjectID: "sub_math", TeacherID: "tch_1", Room: "R-1",
		}},
		Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})
	// Add a second class so we can produce a teacher-only conflict.
	s.Classes = append(s.Classes, &store.Class{
		ID: "cls_2", SchoolID: "school_1", AcademicYearID: "ay_2025", Name: "Grade 6", Status: "active",
	})

	// Now try to put the same teacher into cls_2 at an overlapping time.
	body := `{
		"class_id":"cls_2","subject_id":"sub_math","teacher_id":"tch_1",
		"day_of_week":1,"period_number":1,
		"start_time":"08:30","end_time":"09:15"
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	assert.Equal(t, http.StatusConflict, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	require.False(t, got.Ok)
	require.NotNil(t, got.Error)
	assert.Equal(t, "CONFLICT", got.Error.Code)
}

func TestCreate_AllowsMultipleSubjectsOnSameDayWhenTimesDoNotOverlap(t *testing.T) {
	h, s := newHandler(t)
	s.Subjects = append(s.Subjects, &store.Subject{ID: "sub_eng", SchoolID: "school_1", Name: "English"})
	body := `{
		"class_id":"cls_1",
		"sessions":[
			{"subject_id":"sub_math","teacher_id":"tch_1","day_of_week":1,"period":1,"start_time":"08:00","end_time":"08:45","room":"R-1"},
			{"subject_id":"sub_eng","teacher_id":"tch_1","day_of_week":1,"period":2,"start_time":"09:00","end_time":"09:45","room":"R-1"}
		]
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	assert.True(t, got.Ok)
	require.Len(t, s.Timetables, 1)
	require.Len(t, s.Timetables[0].Sessions, 2)
}

func TestCreate_RejectsSameDayDuplicateTimeSlot(t *testing.T) {
	h, _ := newHandler(t)
	body := `{
		"class_id":"cls_1",
		"sessions":[
			{"subject_id":"sub_math","teacher_id":"tch_1","day_of_week":1,"period":1,"start_time":"08:00","end_time":"08:45"},
			{"subject_id":"sub_math","teacher_id":"tch_1","day_of_week":1,"period":1,"start_time":"09:00","end_time":"09:45"}
		]
	}`
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/timetable", strings.NewReader(body))
	h.Create(w, adminCtx(r))

	require.Equal(t, http.StatusConflict, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	require.False(t, got.Ok)
	assert.Equal(t, "CONFLICT", got.Error.Code)
}

func TestUpdate_BySyntheticID(t *testing.T) {
	h, s := newHandler(t)
	s.Timetables = append(s.Timetables, &store.Timetable{
		ID: "ttb_1", SchoolID: "school_1", AcademicYearID: "ay_2025", ClassID: "cls_1",
		Sessions: []store.TimetableSession{{
			Day: 1, Period: 1, StartsAt: "08:00", EndsAt: "08:45",
			SubjectID: "sub_math", TeacherID: "tch_1", Room: "R-1",
		}},
		Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})

	body := `{"start_time":"08:15","end_time":"09:00"}`
	w := httptest.NewRecorder()
	// Synthetic ID format: {timetableID}_{day}_{period} where day is store-format (0..6, Monday=1).
	r := httptest.NewRequest("PATCH", "/api/timetable/ttb_1_1_1", strings.NewReader(body))
	// Wire the URL param chi normally fills in.
	r = withChiURLParam(r, "id", "ttb_1_1_1")
	h.Update(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	assert.Equal(t, "08:15", s.Timetables[0].Sessions[0].StartsAt)
	assert.Equal(t, "09:00", s.Timetables[0].Sessions[0].EndsAt)
}

func TestDelete_BySyntheticID(t *testing.T) {
	h, s := newHandler(t)
	s.Timetables = append(s.Timetables, &store.Timetable{
		ID: "ttb_1", SchoolID: "school_1", AcademicYearID: "ay_2025", ClassID: "cls_1",
		Sessions: []store.TimetableSession{
			{Day: 1, Period: 1, StartsAt: "08:00", EndsAt: "08:45", SubjectID: "sub_math", TeacherID: "tch_1"},
			{Day: 1, Period: 2, StartsAt: "09:00", EndsAt: "09:45", SubjectID: "sub_math", TeacherID: "tch_1"},
		},
		Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})

	w := httptest.NewRecorder()
	r := httptest.NewRequest("DELETE", "/api/timetable/ttb_1_1_1", nil)
	r = withChiURLParam(r, "id", "ttb_1_1_1")
	h.Delete(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	require.Len(t, s.Timetables, 1)
	require.Len(t, s.Timetables[0].Sessions, 1)
	assert.Equal(t, 2, s.Timetables[0].Sessions[0].Period)
}

func TestSummary_CountsClassesAndConflicts(t *testing.T) {
	h, s := newHandler(t)
	s.Classes = append(s.Classes, &store.Class{
		ID: "cls_2", SchoolID: "school_1", AcademicYearID: "ay_2025", Name: "Grade 6", Status: "active",
	})
	s.Timetables = append(s.Timetables, &store.Timetable{
		ID: "ttb_1", SchoolID: "school_1", AcademicYearID: "ay_2025", ClassID: "cls_1",
		Sessions: []store.TimetableSession{
			{Day: 1, Period: 1, StartsAt: "08:00", EndsAt: "08:45", SubjectID: "sub_math", TeacherID: "tch_1", Room: "R-1"},
		},
		Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})
	s.Timetables = append(s.Timetables, &store.Timetable{
		ID: "ttb_2", SchoolID: "school_1", AcademicYearID: "ay_2025", ClassID: "cls_2",
		Sessions: []store.TimetableSession{
			// Same room as ttb_1 at an overlapping time → room conflict.
			{Day: 1, Period: 1, StartsAt: "08:30", EndsAt: "09:15", SubjectID: "sub_math", TeacherID: "tch_1", Room: "R-1"},
		},
		Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
	})

	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/api/timetable/summary", nil)
	h.Summary(w, adminCtx(r))

	require.Equal(t, http.StatusOK, w.Code, w.Body.String())
	var got api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &got))
	require.True(t, got.Ok)

	raw, _ := json.Marshal(got.Data)
	var sm SummaryResponse
	require.NoError(t, json.Unmarshal(raw, &sm))

	assert.Equal(t, 2, sm.TotalClasses)
	assert.Equal(t, 2, sm.ClassesScheduled)
	assert.GreaterOrEqual(t, sm.ConflictsCount, 1)
}

// withChiURLParam injects a chi route param into the request so handlers
// can chi.URLParam(r, "id") inside unit tests without booting the router.
func withChiURLParam(r *http.Request, key, value string) *http.Request {
	rctx := newChiRouteCtx(key, value)
	return r.WithContext(routeCtxKey(r, rctx))
}
