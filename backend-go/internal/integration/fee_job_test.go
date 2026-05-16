package integration

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/realtime"
	"github.com/eduplexo/backend-go/internal/repo"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupRedisClient(t *testing.T) *redis.Client {
	t.Helper()
	redisURL := getTestRedisURL(t)
	opts, err := redis.ParseURL(redisURL)
	require.NoError(t, err)
	rdb := redis.NewClient(opts)
	t.Cleanup(func() { rdb.Close() })
	return rdb
}

// ─── TEST 1: Fee Generation Async (Queue Submission) ─────────────────────

func TestFeeGeneration_Async(t *testing.T) {
	rdb := setupRedisClient(t)
	ctx := context.Background()

	// Clean queue before test
	rdb.Del(ctx, "queue:fee-generation")

	queue := realtime.NewJobQueue(rdb)

	// Submit a fee generation job
	jobID := store.NewID("job")
	payload := map[string]any{
		"school_id":       testSchoolID,
		"academic_year_id": testYearID,
		"class_ids":       []string{"cls_1", "cls_2"},
		"month":           "May",
		"year":            2025,
	}

	err := queue.Submit(ctx, "fee-generation", jobID, payload)
	require.NoError(t, err)

	// Assert: job status exists in Redis
	status, err := queue.GetStatus(ctx, jobID)
	require.NoError(t, err)
	require.NotNil(t, status)
	assert.Equal(t, "pending", status.Status)
	assert.Equal(t, jobID, status.ID)

	// Assert: queue has 1 item
	queueLen, err := rdb.LLen(ctx, "queue:fee-generation").Result()
	require.NoError(t, err)
	assert.Equal(t, int64(1), queueLen)

	// Cleanup
	rdb.Del(ctx, "queue:fee-generation", "job:"+jobID)
}

// ─── TEST 2: Worker Processes Fee Generation ─────────────────────────────

func TestFeeGeneration_WorkerProcesses(t *testing.T) {
	pool := newTestPool(t)
	rdb := setupRedisClient(t)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	// Setup test data
	createTestSchool(t, pool)
	createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 5)
	_ = studentIDs

	// Insert class fees (fee components for the class)
	_, err := pool.Exec(ctx, `
		INSERT INTO class_fees (id, school_id, class_id, academic_year_id, fee_type_id, amount, type, recurring_cycle, status, created_at, updated_at)
		VALUES ($1, $2, 'test_cls_integ', $3, 'ft_tuition', 5000, 'recurring', 'monthly', 'active', NOW(), NOW())
		ON CONFLICT DO NOTHING
	`, store.NewID("cf"), testSchoolID, testYearID)
	require.NoError(t, err)

	// Create job queue and worker
	queue := realtime.NewJobQueue(rdb)
	hub := realtime.NewHub(rdb)
	defer hub.Shutdown()

	feeRepo := repo.NewFeeRepo(pool, nil)

	worker := realtime.NewWorker(rdb, queue, hub)
	worker.Register("fee-generation", func(wctx context.Context, jobID string, payload json.RawMessage) error {
		var job struct {
			SchoolID       string   `json:"school_id"`
			AcademicYearID string   `json:"academic_year_id"`
			ClassIDs       []string `json:"class_ids"`
			Month          string   `json:"month"`
			Year           int      `json:"year"`
			GeneratedBy    string   `json:"generated_by"`
		}
		if err := json.Unmarshal(payload, &job); err != nil {
			return err
		}

		err := feeRepo.GenerateFees(wctx, repo.FeeGenJob{
			SchoolID:       job.SchoolID,
			AcademicYearID: job.AcademicYearID,
			ClassIDs:       job.ClassIDs,
			Month:          job.Month,
			Year:           job.Year,
			GeneratedBy:    job.GeneratedBy,
		}, func(done, total int) {
			queue.UpdateProgress(wctx, jobID, done, total)
		})
		if err != nil {
			return err
		}

		queue.Complete(wctx, jobID, map[string]any{"created": 5})
		return nil
	})

	// Start worker in background
	workerCtx, workerCancel := context.WithCancel(ctx)
	defer workerCancel()
	go worker.Start(workerCtx)

	// Submit job
	jobID := store.NewID("job")
	err = queue.Submit(ctx, "fee-generation", jobID, map[string]any{
		"school_id":       testSchoolID,
		"academic_year_id": testYearID,
		"class_ids":       []string{"test_cls_integ"},
		"month":           "June",
		"year":            2025,
		"generated_by":    "test_user",
	})
	require.NoError(t, err)

	// Wait for worker to process (max 10 seconds)
	var finalStatus *realtime.JobStatus
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		status, _ := queue.GetStatus(ctx, jobID)
		if status != nil && (status.Status == "completed" || status.Status == "failed") {
			finalStatus = status
			break
		}
		time.Sleep(200 * time.Millisecond)
	}

	require.NotNil(t, finalStatus, "job should complete within 10 seconds")
	assert.Equal(t, "completed", finalStatus.Status, "job should complete successfully")

	// Verify fees created in DB
	var feeCount int
	err = pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM fees 
		WHERE school_id = $1 AND academic_year_id = $2 AND month = 'June'
	`, testSchoolID, testYearID).Scan(&feeCount)
	require.NoError(t, err)
	assert.Equal(t, 5, feeCount, "should create fees for all 5 students")

	// Cleanup
	workerCancel()
	rdb.Del(ctx, "queue:fee-generation", "job:"+jobID)
}

// ─── TEST 3: Job Status Polling ──────────────────────────────────────────

func TestFeeGeneration_StatusPolling(t *testing.T) {
	rdb := setupRedisClient(t)
	ctx := context.Background()

	queue := realtime.NewJobQueue(rdb)
	jobID := store.NewID("job")

	// Submit job
	err := queue.Submit(ctx, "fee-generation", jobID, map[string]any{"test": true})
	require.NoError(t, err)

	// Poll: should be pending
	status, err := queue.GetStatus(ctx, jobID)
	require.NoError(t, err)
	assert.Equal(t, "pending", status.Status)
	assert.Equal(t, 0, status.Progress)

	// Simulate worker updating progress
	queue.UpdateProgress(ctx, jobID, 25, 50)

	status, err = queue.GetStatus(ctx, jobID)
	require.NoError(t, err)
	assert.Equal(t, "processing", status.Status)
	assert.Equal(t, 25, status.Progress)
	assert.Equal(t, 50, status.Total)

	// Simulate completion
	queue.Complete(ctx, jobID, map[string]any{"created": 50})

	status, err = queue.GetStatus(ctx, jobID)
	require.NoError(t, err)
	assert.Equal(t, "completed", status.Status)
	assert.Equal(t, 50, status.Progress)
	assert.Equal(t, 50, status.Total)

	// Cleanup
	rdb.Del(ctx, "job:"+jobID, "queue:fee-generation")
}

// ─── TEST 4: Job Failure ─────────────────────────────────────────────────

func TestFeeGeneration_Failure(t *testing.T) {
	rdb := setupRedisClient(t)
	ctx := context.Background()

	queue := realtime.NewJobQueue(rdb)
	jobID := store.NewID("job")

	err := queue.Submit(ctx, "fee-generation", jobID, map[string]any{})
	require.NoError(t, err)

	// Simulate failure
	queue.Fail(ctx, jobID, "class not found")

	status, err := queue.GetStatus(ctx, jobID)
	require.NoError(t, err)
	assert.Equal(t, "failed", status.Status)
	assert.Equal(t, "class not found", status.Error)

	// Cleanup
	rdb.Del(ctx, "job:"+jobID)
}
