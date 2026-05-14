// Package academicyear implements the /api/academic-years endpoints.
// Mirrors old-app/shared/services/academic-year.service.ts and
// old-app/school-app/app/api/academic-years/[*]/route.ts.
package academicyear

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store *store.MemStore
	Save  func(table string, doc any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Save: save}
}

// AcademicYearResponse mirrors the `toAcademicYearResponse` shape the original
// service returns. The frontend reads `_id` and `id` interchangeably.
type AcademicYearResponse struct {
	ID          string    `json:"_id"`
	IDAlias     string    `json:"id"`
	Year        string    `json:"year"`
	Name        string    `json:"name"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	IsActive    bool      `json:"is_active"`
	Status      string    `json:"status"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func toResponse(y *store.AcademicYear) AcademicYearResponse {
	return AcademicYearResponse{
		ID:          y.ID,
		IDAlias:     y.ID,
		Year:        y.Year,
		Name:        y.Year,
		StartDate:   y.StartDate,
		EndDate:     y.EndDate,
		IsActive:    y.IsActive,
		Status:      y.Status,
		Description: y.Description,
		CreatedAt:   y.CreatedAt,
		UpdatedAt:   y.UpdatedAt,
	}
}

// List implements GET /api/academic-years. Returns all academic years for
// the caller's tenant, sorted by start_date desc.
// Always returns paginated shape { items, total, page, limit, pages } so the
// frontend hook `useAcademicYears` can consume it directly.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionView); err != nil {
			return nil, err
		}

		h.Store.RLock()
		rows := make([]*store.AcademicYear, 0)
		for _, y := range h.Store.AcademicYears {
			if y.SchoolID == ctx.SchoolID {
				rows = append(rows, y)
			}
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartDate.After(rows[j].StartDate)
		})

		items := make([]AcademicYearResponse, 0, len(rows))
		for _, y := range rows {
			items = append(items, toResponse(y))
		}

		page := api.ParsePagination(q)
		if !page.Enabled {
			// Even without explicit pagination, return the paginated shape
			// so the frontend always gets { items, total, pages }.
			total := len(items)
			pages := 1
			if total == 0 {
				pages = 1
			}
			return map[string]any{
				"items": items,
				"total": total,
				"page":  1,
				"limit": total,
				"pages": pages,
			}, nil
		}
		total := len(items)
		start := page.Skip
		end := start + page.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		return api.BuildPaginated(items[start:end], total, page), nil
	}))
}

// Get implements GET /api/academic-years/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, y := range h.Store.AcademicYears {
			if y.ID == id && y.SchoolID == ctx.SchoolID {
				return toResponse(y), nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Academic year not found.", 404, nil)
	}))
}

type createInput struct {
	Year        string `json:"year"`
	Name        string `json:"name"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	IsActive    bool   `json:"is_active"`
	Description string `json:"description,omitempty"`
}

// parseFlexibleDate accepts RFC3339, RFC3339Nano, or plain ISO dates
// like "2026-01-01" that <input type="date"> emits. Returns zero time
// if the input is empty.
func parseFlexibleDate(raw string) (time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return time.Time{}, nil
	}
	for _, layout := range []string{
		time.RFC3339Nano,
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02",
		"01/02/2006",
		"02/01/2006",
	} {
		if t, err := time.Parse(layout, raw); err == nil {
			return t, nil
		}
	}
	return time.Time{}, errInvalidDate(raw)
}

func errInvalidDate(raw string) error {
	return api.NewControlledError("VALIDATION_ERROR",
		"Invalid date \""+raw+"\". Expected formats: 2026-01-01 or RFC3339 timestamp.",
		400, nil)
}

// Create implements POST /api/academic-years.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (AcademicYearResponse, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionCreate); err != nil {
			return AcademicYearResponse{}, err
		}

		year := strings.TrimSpace(body.Year)
		if year == "" {
			year = strings.TrimSpace(body.Name)
		}
		if year == "" {
			return AcademicYearResponse{}, api.NewControlledError("VALIDATION_ERROR", "Year is required.", 400, nil)
		}

		startDate, err := parseFlexibleDate(body.StartDate)
		if err != nil {
			return AcademicYearResponse{}, err
		}
		endDate, err := parseFlexibleDate(body.EndDate)
		if err != nil {
			return AcademicYearResponse{}, err
		}
		if startDate.IsZero() || endDate.IsZero() {
			return AcademicYearResponse{}, api.NewControlledError("VALIDATION_ERROR", "start_date and end_date are required.", 400, nil)
		}
		if !endDate.After(startDate) {
			return AcademicYearResponse{}, api.NewControlledError("VALIDATION_ERROR", "end_date must be after start_date.", 400, nil)
		}

		now := time.Now()
		newYear := &store.AcademicYear{
			ID:          store.NewID("ay"),
			SchoolID:    ctx.SchoolID,
			Year:        year,
			StartDate:   startDate,
			EndDate:     endDate,
			IsActive:    body.IsActive,
			Status:      deriveStatus(startDate, endDate, body.IsActive),
			Description: body.Description,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		h.Store.Lock()
		if newYear.IsActive {
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID {
					y.IsActive = false
				}
			}
		}
		h.Store.AcademicYears = append(h.Store.AcademicYears, newYear)
		h.Store.Unlock()

		h.Save("academic_years", newYear)
		if newYear.IsActive {
			// Save other years too since their IsActive changed
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID && y.ID != newYear.ID {
					h.Save("academic_years", y)
				}
			}
		}

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "school", EntityID: newYear.ID,
			After:    newYear,
			Metadata: map[string]any{"scope": "academic_year"},
		})

		return toResponse(newYear), nil
	}))
}

type updateInput struct {
	Year        *string `json:"year,omitempty"`
	Name        *string `json:"name,omitempty"`
	StartDate   *string `json:"start_date,omitempty"`
	EndDate     *string `json:"end_date,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
	Description *string `json:"description,omitempty"`
}

// Update implements PATCH /api/academic-years/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	var body updateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() (AcademicYearResponse, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionUpdate); err != nil {
			return AcademicYearResponse{}, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		var target *store.AcademicYear
		for _, y := range h.Store.AcademicYears {
			if y.ID == id && y.SchoolID == ctx.SchoolID {
				target = y
				break
			}
		}
		if target == nil {
			return AcademicYearResponse{}, api.NewControlledError("NOT_FOUND", "Academic year not found.", 404, nil)
		}

		nextActive := target.IsActive
		if body.IsActive != nil {
			nextActive = *body.IsActive
		}

		// Constraint check: at least one academic year must remain active.
		if !nextActive && target.IsActive {
			activeCount := 0
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID && y.IsActive {
					activeCount++
				}
			}
			if activeCount <= 1 {
				return AcademicYearResponse{}, api.NewControlledError(
					"CONSTRAINT_ERROR",
					"At least one academic year must remain active for system operations.",
					400, nil,
				)
			}
		}

		if nextActive {
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID {
					y.IsActive = false
				}
			}
		}

		before := *target
		if body.Year != nil {
			target.Year = strings.TrimSpace(*body.Year)
		} else if body.Name != nil {
			target.Year = strings.TrimSpace(*body.Name)
		}
		if body.StartDate != nil {
			parsed, err := parseFlexibleDate(*body.StartDate)
			if err != nil {
				return AcademicYearResponse{}, err
			}
			if !parsed.IsZero() {
				target.StartDate = parsed
			}
		}
		if body.EndDate != nil {
			parsed, err := parseFlexibleDate(*body.EndDate)
			if err != nil {
				return AcademicYearResponse{}, err
			}
			if !parsed.IsZero() {
				target.EndDate = parsed
			}
		}
		if body.Description != nil {
			target.Description = *body.Description
		}
		target.IsActive = nextActive
		target.Status = deriveStatus(target.StartDate, target.EndDate, target.IsActive)
		target.UpdatedAt = time.Now()

		h.Save("academic_years", target)
		if nextActive {
			// Save other years too since their IsActive changed
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID && y.ID != target.ID {
					h.Save("academic_years", y)
				}
			}
		}

		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "school", EntityID: id,
			Before: before, After: *target,
			Metadata: map[string]any{"scope": "academic_year"},
		})

		return toResponse(target), nil
	}))
}

// Delete implements DELETE /api/academic-years/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionDelete); err != nil {
			return nil, err
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		idx := -1
		for i, y := range h.Store.AcademicYears {
			if y.ID == id && y.SchoolID == ctx.SchoolID {
				idx = i
				break
			}
		}
		if idx == -1 {
			return nil, api.NewControlledError("NOT_FOUND", "Academic year not found.", 404, nil)
		}

		target := h.Store.AcademicYears[idx]
		if target.IsActive {
			activeCount := 0
			for _, y := range h.Store.AcademicYears {
				if y.SchoolID == ctx.SchoolID && y.IsActive {
					activeCount++
				}
			}
			if activeCount <= 1 {
				return nil, api.NewControlledError(
					"CONSTRAINT_ERROR",
					"At least one academic year must remain active. You cannot delete the only active session.",
					400, nil,
				)
			}
		}

		h.Store.AcademicYears = append(h.Store.AcademicYears[:idx], h.Store.AcademicYears[idx+1:]...)

		h.Save("academic_years:delete", target.ID)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "delete", EntityType: "school", EntityID: id,
			Before:   target,
			Metadata: map[string]any{"scope": "academic_year"},
		})

		return map[string]any{"success": true, "id": id}, nil
	}))
}

func deriveStatus(start, end time.Time, isActive bool) string {
	if isActive {
		return "active"
	}
	now := time.Now()
	if end.Before(now) {
		return "completed"
	}
	if start.After(now) {
		return "draft"
	}
	// In-progress but not flagged as active.
	return "draft"
}
