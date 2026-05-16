package parent

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
)

// LiveClasses implements GET /api/parent/live-classes.
// Returns live class sessions filtered by the selected student's class.
// Supports ?student_id query param for child switching.
func (h *Handler) LiveClasses(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	student := h.resolveStudent(ctx, studentID)

	if student == nil {
		api.WriteResult(w, api.Ok([]any{}))
		return
	}

	api.WriteResult(w, api.ServiceTry(func() ([]map[string]any, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()

		now := time.Now()
		meetings := make([]map[string]any, 0)

		for _, lc := range h.Store.LiveClasses {
			// Filter: same school + same class as student
			if lc.SchoolID != ctx.SchoolID {
				continue
			}
			if lc.ClassID != student.ClassID {
				continue
			}
			// Filter by academic year if set
			if lc.AcademicYearID != "" && student.AcademicYearID != "" && lc.AcademicYearID != student.AcademicYearID {
				continue
			}
			// Skip cancelled
			if lc.Status == "cancelled" {
				continue
			}

			// Calculate real-time status
			status := "upcoming"
			if now.After(lc.StartsAt) && now.Before(lc.EndsAt) {
				status = "live"
			} else if now.After(lc.EndsAt) {
				status = "ended"
			}

			// Find teacher name
			teacherName := ""
			for _, t := range h.Store.Teachers {
				if t.ID == lc.HostTeacherID {
					teacherName = strings.TrimSpace(t.FirstName + " " + t.LastName)
					break
				}
			}

			// Find class name
			className := ""
			for _, c := range h.Store.Classes {
				if c.ID == lc.ClassID {
					className = c.Name
					break
				}
			}

			meetings = append(meetings, map[string]any{
				"_id":          lc.ID,
				"title":        lc.Title,
				"subject":      lc.Subject,
				"description":  lc.Description,
				"teacher_name": teacherName,
				"class_name":   className,
				"class_id":     lc.ClassID,
				"starts_at":    lc.StartsAt,
				"ends_at":      lc.EndsAt,
				"join_url":     lc.JoinURL,
				"provider":     lc.Provider,
				"status":       status,
				"created_at":   lc.CreatedAt,
			})
		}

		// Sort: live first, then upcoming by date, then ended
		sort.SliceStable(meetings, func(i, j int) bool {
			si := meetings[i]["status"].(string)
			sj := meetings[j]["status"].(string)
			order := map[string]int{"live": 0, "upcoming": 1, "ended": 2}
			if order[si] != order[sj] {
				return order[si] < order[sj]
			}
			ti := meetings[i]["starts_at"].(time.Time)
			tj := meetings[j]["starts_at"].(time.Time)
			if si == "ended" {
				return ti.After(tj) // Most recent ended first
			}
			return ti.Before(tj) // Soonest upcoming first
		})

		return meetings, nil
	}))
}
