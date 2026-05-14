package students

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─── Test Helpers ────────────────────────────────────────────────────────

func newTestHandler(students []*store.Student) *Handler {
	s := &store.MemStore{
		Students: students,
		// Add a user with admin permissions for auth checks
		Users: []*store.User{{
			ID: "user_1", SchoolID: "school_1", Role: "admin",
			Permissions: []string{"students:view", "students:create", "students:update", "students:delete"},
		}},
		AcademicYears: []*store.AcademicYear{{
			ID: "ay_2025", SchoolID: "school_1", IsActive: true, Status: "active",
		}},
	}
	return New(s, nil)
}

func makeStudents(n int) []*store.Student {
	students := make([]*store.Student, n)
	for i := 0; i < n; i++ {
		students[i] = &store.Student{
			ID:             store.NewID("stu"),
			SchoolID:       "school_1",
			AcademicYearID: "ay_2025",
			FirstName:      "Student",
			LastName:       padLeft(i+1, 3),
			AdmissionNo:    "STU-" + padLeft(i+1, 5),
			ClassID:        "cls_1",
			Section:        "A",
			Status:         "active",
			Guardian:       store.Guardian{Name: "Parent", Phone: "1234567890"},
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
	}
	return students
}

func makeAuthRequest(method, path string) *http.Request {
	r := httptest.NewRequest(method, path, nil)
	ctx := api.WithContext(r.Context(), &api.RequestContext{
		SchoolID:             "school_1",
		UserID:               "user_1",
		Role:                 "admin",
		Permissions:          []string{"students:view", "students:create", "students:update", "students:delete"},
		ActiveAcademicYearID: "ay_2025",
	})
	return r.WithContext(ctx)
}

// ─── TEST: Default Pagination ────────────────────────────────────────────

func TestStudentList_DefaultPagination(t *testing.T) {
	h := newTestHandler(makeStudents(50))

	// Act: request with page=1&limit=25 (default pagination)
	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students?page=1&limit=25")
	h.List(w, r)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)
	assert.True(t, body.Ok)

	// Parse the paginated response
	dataJSON, _ := json.Marshal(body.Data)
	var paginated api.Paginated[any]
	err = json.Unmarshal(dataJSON, &paginated)
	require.NoError(t, err)

	assert.Equal(t, 25, len(paginated.Items))
	assert.Equal(t, 50, paginated.Total)
	assert.Equal(t, 1, paginated.Page)
	assert.Equal(t, 25, paginated.Limit)
	assert.Equal(t, 2, paginated.Pages)
}

// ─── TEST: Custom Page ───────────────────────────────────────────────────

func TestStudentList_CustomPage(t *testing.T) {
	h := newTestHandler(makeStudents(30))

	// Act: page 2 with 10 per page
	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students?page=2&per_page=10")
	h.List(w, r)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)

	dataJSON, _ := json.Marshal(body.Data)
	var paginated api.Paginated[any]
	err = json.Unmarshal(dataJSON, &paginated)
	require.NoError(t, err)

	assert.Equal(t, 10, len(paginated.Items))
	assert.Equal(t, 30, paginated.Total)
	assert.Equal(t, 2, paginated.Page)
	assert.Equal(t, 10, paginated.Limit)
	assert.Equal(t, 3, paginated.Pages)
}

// ─── TEST: Max Per Page Cap ──────────────────────────────────────────────

func TestStudentList_ExceedsMaxPerPage(t *testing.T) {
	h := newTestHandler(makeStudents(300))

	// Act: request per_page=999 (should be capped at 200)
	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students?page=1&per_page=999")
	h.List(w, r)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)

	dataJSON, _ := json.Marshal(body.Data)
	var paginated api.Paginated[any]
	err = json.Unmarshal(dataJSON, &paginated)
	require.NoError(t, err)

	// Max is 200 (defined in ParsePagination)
	assert.LessOrEqual(t, len(paginated.Items), 200)
	assert.Equal(t, 200, paginated.Limit)
}

// ─── TEST: Empty Result ──────────────────────────────────────────────────

func TestStudentList_EmptyResult(t *testing.T) {
	// School has no students
	h := newTestHandler([]*store.Student{})

	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students?page=1&limit=25")
	h.List(w, r)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)
	assert.True(t, body.Ok)

	dataJSON, _ := json.Marshal(body.Data)
	var paginated api.Paginated[any]
	err = json.Unmarshal(dataJSON, &paginated)
	require.NoError(t, err)

	assert.Equal(t, 0, len(paginated.Items))
	assert.Equal(t, 0, paginated.Total)
	assert.Equal(t, 1, paginated.Pages) // At least 1 page even when empty
}

// ─── TEST: No Pagination Params → Full Array ─────────────────────────────

func TestStudentList_NoPaginationParams_ReturnsFullArray(t *testing.T) {
	h := newTestHandler(makeStudents(5))

	// Act: no page/limit params → returns flat array (backward compat)
	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students")
	h.List(w, r)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)
	assert.True(t, body.Ok)

	// Should be a flat array, not paginated
	dataJSON, _ := json.Marshal(body.Data)
	var items []any
	err = json.Unmarshal(dataJSON, &items)
	require.NoError(t, err)
	assert.Equal(t, 5, len(items))
}

// ─── TEST: Search Filter ─────────────────────────────────────────────────

func TestStudentList_SearchFilter(t *testing.T) {
	students := []*store.Student{
		{ID: "s1", SchoolID: "school_1", AcademicYearID: "ay_2025", FirstName: "Ali", LastName: "Khan", Status: "active", AdmissionNo: "STU-001", Guardian: store.Guardian{Name: "P", Phone: "1"}},
		{ID: "s2", SchoolID: "school_1", AcademicYearID: "ay_2025", FirstName: "Sara", LastName: "Ahmed", Status: "active", AdmissionNo: "STU-002", Guardian: store.Guardian{Name: "P", Phone: "1"}},
		{ID: "s3", SchoolID: "school_1", AcademicYearID: "ay_2025", FirstName: "Zain", LastName: "Ali", Status: "active", AdmissionNo: "STU-003", Guardian: store.Guardian{Name: "P", Phone: "1"}},
	}
	h := newTestHandler(students)

	// Act: search for "ali"
	w := httptest.NewRecorder()
	r := makeAuthRequest("GET", "/api/students?page=1&limit=25&search=ali")
	h.List(w, r)

	// Assert: should match "Ali Khan" and "Zain Ali"
	require.Equal(t, http.StatusOK, w.Code)

	var body api.ServiceResult
	_ = json.Unmarshal(w.Body.Bytes(), &body)

	dataJSON, _ := json.Marshal(body.Data)
	var paginated api.Paginated[any]
	_ = json.Unmarshal(dataJSON, &paginated)

	assert.Equal(t, 2, paginated.Total) // Ali Khan + Zain Ali
}

// ─── TEST: Table-Driven Pagination Edge Cases ────────────────────────────

func TestStudentList_PaginationEdgeCases(t *testing.T) {
	tests := []struct {
		name        string
		query       string
		totalItems  int
		expectItems int
		expectPage  int
		expectPages int
	}{
		{
			name:        "last page partial",
			query:       "?page=3&limit=10",
			totalItems:  25,
			expectItems: 5, // 25 - 20 = 5 remaining
			expectPage:  3,
			expectPages: 3,
		},
		{
			name:        "page beyond total",
			query:       "?page=10&limit=25",
			totalItems:  5,
			expectItems: 0,
			expectPage:  10,
			expectPages: 1,
		},
		{
			name:        "single item",
			query:       "?page=1&limit=25",
			totalItems:  1,
			expectItems: 1,
			expectPage:  1,
			expectPages: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestHandler(makeStudents(tt.totalItems))

			w := httptest.NewRecorder()
			r := makeAuthRequest("GET", "/api/students"+tt.query)
			h.List(w, r)

			require.Equal(t, http.StatusOK, w.Code)

			var body api.ServiceResult
			_ = json.Unmarshal(w.Body.Bytes(), &body)
			dataJSON, _ := json.Marshal(body.Data)
			var paginated api.Paginated[any]
			_ = json.Unmarshal(dataJSON, &paginated)

			assert.Equal(t, tt.expectItems, len(paginated.Items), "items count")
			assert.Equal(t, tt.totalItems, paginated.Total, "total")
			assert.Equal(t, tt.expectPage, paginated.Page, "page")
			assert.Equal(t, tt.expectPages, paginated.Pages, "pages")
		})
	}
}
