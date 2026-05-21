// handlers.go — HTTP handlers for WebSocket, job status, and composite dashboard.
package realtime

import (
	"encoding/json"
	"net/http"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// JobStatusHandler returns GET /api/jobs/{id}/status.
func JobStatusHandler(queue *JobQueue) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		jobID := chi.URLParam(r, "id")
		if jobID == "" {
			api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Job ID is required.", 400, nil))
			return
		}

		status, err := queue.GetStatus(r.Context(), jobID)
		if err != nil {
			api.WriteResult(w, api.Fail("INTERNAL_ERROR", "Failed to get job status.", 500, nil))
			return
		}
		if status == nil {
			api.WriteResult(w, api.Fail("NOT_FOUND", "Job not found.", 404, nil))
			return
		}

		api.WriteResult(w, api.Ok(status))
	}
}

// FeeGenerateAsyncHandler handles POST /api/fees/generate-async.
// Instead of blocking for 5-30s, it queues the job and returns immediately.
func FeeGenerateAsyncHandler(queue *JobQueue) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := api.FromRequest(r)

		var body json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
			return
		}

		// Generate job ID
		jobID := store.NewID("job")

		// Wrap payload with school context
		payload := map[string]any{
			"school_id":        ctx.SchoolID,
			"academic_year_id": ctx.ActiveAcademicYearID,
			"user_id":          ctx.UserID,
			"body":             body,
		}

		if err := queue.Submit(r.Context(), "fee-generation", jobID, payload); err != nil {
			api.WriteResult(w, api.Fail("INTERNAL_ERROR", "Failed to queue job: "+err.Error(), 500, nil))
			return
		}

		// Return 202 Accepted with job ID
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(api.Ok(map[string]any{
			"job_id":  jobID,
			"status":  "pending",
			"message": "Fee generation queued. Poll /api/jobs/" + jobID + "/status for progress.",
		}))
	}
}
