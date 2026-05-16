// jobs.go — Background job queue using Redis lists.
//
// Pattern: Producer pushes to Redis list, Worker BRPOPs and processes.
//
// Job types:
//   - fee-generation: Create monthly fee records for all students in a class
//   - notification-dispatch: Fan-out notification to multiple users
//
// Job lifecycle:
//   1. Handler creates job → LPUSH queue:{type} → returns job_id (202 Accepted)
//   2. Worker BRPOP queue:{type} → processes → updates status in Redis
//   3. Frontend polls GET /api/jobs/{id}/status → sees progress/completion
package realtime

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// JobStatus represents the current state of a background job.
type JobStatus struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Status    string    `json:"status"` // "pending", "processing", "completed", "failed"
	Progress  int       `json:"progress"`
	Total     int       `json:"total"`
	Result    any       `json:"result,omitempty"`
	Error     string    `json:"error,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// JobQueue manages background job submission and status tracking.
type JobQueue struct {
	rdb *redis.Client
}

// NewJobQueue creates a job queue backed by Redis.
func NewJobQueue(rdb *redis.Client) *JobQueue {
	return &JobQueue{rdb: rdb}
}

// Submit pushes a job to the queue and returns the job ID.
// The job payload is stored in Redis for the worker to pick up.
func (q *JobQueue) Submit(ctx context.Context, jobType string, jobID string, payload any) error {
	if q.rdb == nil {
		return fmt.Errorf("redis not available for job queue")
	}

	// Store job status
	status := JobStatus{
		ID:        jobID,
		Type:      jobType,
		Status:    "pending",
		Progress:  0,
		Total:     0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	statusJSON, _ := json.Marshal(status)
	q.rdb.Set(ctx, "job:"+jobID, statusJSON, 1*time.Hour)

	// Push job payload to queue
	jobData, err := json.Marshal(map[string]any{
		"id":      jobID,
		"type":    jobType,
		"payload": payload,
	})
	if err != nil {
		return err
	}

	return q.rdb.LPush(ctx, "queue:"+jobType, jobData).Err()
}

// GetStatus retrieves the current status of a job.
func (q *JobQueue) GetStatus(ctx context.Context, jobID string) (*JobStatus, error) {
	if q.rdb == nil {
		return nil, fmt.Errorf("redis not available")
	}

	data, err := q.rdb.Get(ctx, "job:"+jobID).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var status JobStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, err
	}
	return &status, nil
}

// UpdateProgress updates the progress of a running job.
func (q *JobQueue) UpdateProgress(ctx context.Context, jobID string, progress, total int) {
	if q.rdb == nil {
		return
	}

	data, err := q.rdb.Get(ctx, "job:"+jobID).Bytes()
	if err != nil {
		return
	}

	var status JobStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return
	}

	status.Status = "processing"
	status.Progress = progress
	status.Total = total
	status.UpdatedAt = time.Now()

	updated, _ := json.Marshal(status)
	q.rdb.Set(ctx, "job:"+jobID, updated, 1*time.Hour)
}

// Complete marks a job as completed with a result.
func (q *JobQueue) Complete(ctx context.Context, jobID string, result any) {
	if q.rdb == nil {
		return
	}

	data, err := q.rdb.Get(ctx, "job:"+jobID).Bytes()
	if err != nil {
		return
	}

	var status JobStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return
	}

	status.Status = "completed"
	status.Progress = status.Total
	status.Result = result
	status.UpdatedAt = time.Now()

	updated, _ := json.Marshal(status)
	q.rdb.Set(ctx, "job:"+jobID, updated, 1*time.Hour)
}

// Fail marks a job as failed with an error message.
func (q *JobQueue) Fail(ctx context.Context, jobID string, errMsg string) {
	if q.rdb == nil {
		return
	}

	data, err := q.rdb.Get(ctx, "job:"+jobID).Bytes()
	if err != nil {
		return
	}

	var status JobStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return
	}

	status.Status = "failed"
	status.Error = errMsg
	status.UpdatedAt = time.Now()

	updated, _ := json.Marshal(status)
	q.rdb.Set(ctx, "job:"+jobID, updated, 1*time.Hour)
}

// ─── Worker ──────────────────────────────────────────────────────────────

// Worker processes jobs from a Redis queue.
type Worker struct {
	rdb      *redis.Client
	queue    *JobQueue
	hub      *Hub
	handlers map[string]JobHandler
}

// JobHandler processes a single job. Returns error on failure.
type JobHandler func(ctx context.Context, jobID string, payload json.RawMessage) error

// NewWorker creates a background job worker.
func NewWorker(rdb *redis.Client, queue *JobQueue, hub *Hub) *Worker {
	return &Worker{
		rdb:      rdb,
		queue:    queue,
		hub:      hub,
		handlers: make(map[string]JobHandler),
	}
}

// Register adds a handler for a job type.
func (w *Worker) Register(jobType string, handler JobHandler) {
	w.handlers[jobType] = handler
}

// Start begins processing jobs. Blocks until context is cancelled.
func (w *Worker) Start(ctx context.Context) {
	// Build list of queue names to listen on
	queues := make([]string, 0, len(w.handlers))
	for jobType := range w.handlers {
		queues = append(queues, "queue:"+jobType)
	}

	if len(queues) == 0 {
		log.Println("[worker] no job handlers registered, exiting")
		return
	}

	log.Printf("[worker] started, listening on queues: %v", queues)

	for {
		select {
		case <-ctx.Done():
			log.Println("[worker] shutting down")
			return
		default:
		}

		// BRPOP with 5s timeout (allows checking ctx.Done periodically)
		result, err := w.rdb.BRPop(ctx, 5*time.Second, queues...).Result()
		if err != nil {
			if err == redis.Nil {
				continue // Timeout, no jobs available
			}
			if ctx.Err() != nil {
				return // Context cancelled
			}
			log.Printf("[worker] BRPOP error: %v", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if len(result) < 2 {
			continue
		}

		// result[0] = queue name, result[1] = job data
		var job struct {
			ID      string          `json:"id"`
			Type    string          `json:"type"`
			Payload json.RawMessage `json:"payload"`
		}
		if err := json.Unmarshal([]byte(result[1]), &job); err != nil {
			log.Printf("[worker] invalid job data: %v", err)
			continue
		}

		handler, ok := w.handlers[job.Type]
		if !ok {
			log.Printf("[worker] no handler for job type: %s", job.Type)
			continue
		}

		log.Printf("[worker] processing job: id=%s type=%s", job.ID, job.Type)

		if err := handler(ctx, job.ID, job.Payload); err != nil {
			log.Printf("[worker] job %s failed: %v", job.ID, err)
			w.queue.Fail(ctx, job.ID, err.Error())
		}
	}
}
