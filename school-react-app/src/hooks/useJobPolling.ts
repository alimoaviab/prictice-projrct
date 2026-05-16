/**
 * useJobPolling — polls a background job's status until completion.
 *
 * Used for long-running operations like fee generation that return a job_id
 * immediately (202 Accepted) and process in the background.
 *
 * Features:
 *   - Polls every 2 seconds while job is pending/processing
 *   - Stops polling on completion or failure
 *   - Shows progress (e.g., "45/120 students")
 *   - Invalidates related caches on completion
 *   - Retry button on failure
 *
 * Usage:
 * ```tsx
 * const { startJob, progress, total, status, error, retry } = useJobPolling({
 *   onComplete: () => {
 *     queryClient.invalidateQueries({ queryKey: ['fees'] });
 *     showToast('Fees generated successfully!', 'success');
 *   },
 * });
 *
 * // Trigger the job
 * const handleGenerate = async () => {
 *   const result = await serviceRequest('/api/fees/generate-async', { method: 'POST', body });
 *   if (result.ok) startJob(result.data.job_id);
 * };
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { serviceRequest } from "@/services/service-client";

interface JobStatusResponse {
  id: string;
  type: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

interface UseJobPollingOptions {
  pollInterval?: number; // ms, default 2000
  onComplete?: (result: any) => void;
  onFail?: (error: string) => void;
}

export function useJobPolling(opts: UseJobPollingOptions = {}) {
  const pollInterval = opts.pollInterval ?? 2000;

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatusResponse["status"] | "idle">("idle");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPayloadRef = useRef<any>(null);

  // Start polling a job
  const startJob = useCallback((id: string, payload?: any) => {
    setJobId(id);
    setStatus("pending");
    setProgress(0);
    setTotal(0);
    setError(null);
    setResult(null);
    lastPayloadRef.current = payload;
  }, []);

  // Poll the job status
  useEffect(() => {
    if (!jobId || status === "completed" || status === "failed" || status === "idle") {
      return;
    }

    const poll = async () => {
      try {
        const res = await serviceRequest<JobStatusResponse>(
          `/api/jobs/${jobId}/status`
        );

        if (!res.ok || !res.data) return;

        const job = res.data;
        setStatus(job.status);
        setProgress(job.progress);
        setTotal(job.total);

        if (job.status === "completed") {
          setResult(job.result);
          opts.onComplete?.(job.result);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else if (job.status === "failed") {
          setError(job.error || "Job failed");
          opts.onFail?.(job.error || "Job failed");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // Network error — keep polling
      }
    };

    // Initial poll immediately
    void poll();

    // Then poll at interval
    intervalRef.current = setInterval(poll, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, status, pollInterval, opts]);

  // Retry: resubmit the same job
  const retry = useCallback(async () => {
    if (!lastPayloadRef.current) return;
    setStatus("idle");
    setError(null);
    // Caller should re-trigger the API call
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setJobId(null);
    setStatus("idle");
    setProgress(0);
    setTotal(0);
    setError(null);
    setResult(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const isActive = status === "pending" || status === "processing";
  const percentComplete = total > 0 ? Math.round((progress / total) * 100) : 0;

  return {
    startJob,
    jobId,
    status,
    progress,
    total,
    percentComplete,
    error,
    result,
    isActive,
    retry,
    reset,
  };
}
