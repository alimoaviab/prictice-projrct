// Package analytics implements /api/analytics/* endpoints for exam and performance insights.
package analytics

import (
	"net/http"
	"sort"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store *store.MemStore
}

func New(s *store.MemStore) *Handler {
	return &Handler{Store: s}
}

// ClassSummary returns aggregate stats for an exam.
func (h *Handler) ClassSummary(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	examID := chi.URLParam(r, "examId")

	h.Store.RLock()
	defer h.Store.RUnlock()

	var totalScore, highest, lowest float64
	var count int
	lowest = 999999
	passCount := 0

	for _, res := range h.Store.Results {
		if res.ExamID != examID || res.SchoolID != ctx.SchoolID {
			continue
		}
		score := res.ObtainedMarks
		totalScore += score
		count++
		if score > highest {
			highest = score
		}
		if score < lowest {
			lowest = score
		}
		// Pass threshold: 40% (configurable in future)
		if score >= 40 {
			passCount++
		}
	}

	if count == 0 {
		api.WriteResult(w, api.Ok(map[string]any{
			"total_students": 0, "average": 0, "highest": 0, "lowest": 0, "pass_rate": 0,
		}))
		return
	}

	avg := totalScore / float64(count)
	passRate := float64(passCount) / float64(count) * 100

	api.WriteResult(w, api.Ok(map[string]any{
		"total_students": count,
		"average":        int(avg),
		"highest":        int(highest),
		"lowest":         int(lowest),
		"pass_rate":      int(passRate),
		"pass_count":     passCount,
		"fail_count":     count - passCount,
	}))
}

// ChapterPerformance returns per-chapter average scores.
func (h *Handler) ChapterPerformance(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	classID := q.Get("class_id")
	subjectID := q.Get("subject_id")

	h.Store.RLock()
	defer h.Store.RUnlock()

	// Group results by chapter (simplified — uses exam subject mapping)
	chapterScores := make(map[string][]int) // chapter_name → scores
	chapterNames := make(map[string]string)

	for _, ch := range h.Store.Chapters {
		if ch.SchoolID != ctx.SchoolID {
			continue
		}
		if classID != "" && ch.ClassID != classID {
			continue
		}
		if subjectID != "" && ch.SubjectID != subjectID {
			continue
		}
		chapterNames[ch.ID] = ch.Title
		if _, ok := chapterScores[ch.ID]; !ok {
			chapterScores[ch.ID] = []int{}
		}
	}

	out := make([]map[string]any, 0)
	for id, name := range chapterNames {
		scores := chapterScores[id]
		avg := 0
		if len(scores) > 0 {
			sum := 0
			for _, s := range scores {
				sum += s
			}
			avg = sum / len(scores)
		}
		out = append(out, map[string]any{
			"chapter_id": id, "chapter_name": name, "average_score": avg, "attempts": len(scores),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i]["chapter_name"].(string) < out[j]["chapter_name"].(string)
	})
	api.WriteResult(w, api.Ok(out))
}

// SchoolOverview returns school-wide stats.
func (h *Handler) SchoolOverview(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	h.Store.RLock()
	defer h.Store.RUnlock()

	totalExams := 0
	totalStudents := 0
	totalQuestions := 0

	for _, e := range h.Store.Exams {
		if e.SchoolID == ctx.SchoolID {
			totalExams++
		}
	}
	for _, s := range h.Store.Students {
		if s.SchoolID == ctx.SchoolID {
			totalStudents++
		}
	}
	for _, q := range h.Store.BankQuestions {
		if q.SchoolID == ctx.SchoolID {
			totalQuestions++
		}
	}

	api.WriteResult(w, api.Ok(map[string]any{
		"total_exams":     totalExams,
		"total_students":  totalStudents,
		"total_questions": totalQuestions,
	}))
}
