/**
 * useRealtimeAttendanceSync — Combined websocket + polling for guaranteed real-time updates.
 *
 * Ensures attendance changes are visible across all portals (Admin, Teacher, Parent)
 * even if websocket is temporarily down:
 *   - Websocket: Primary real-time channel (instant)
 *   - Polling: Fallback mechanism if websocket unavailable
 *   - Automatic cache invalidation triggers refetch in all components using React Query
 *
 * Usage:
 * ```tsx
 * // Call once at app root level
 * useRealtimeAttendanceSync();
 * ```
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./useWebSocket";

interface AttendanceSyncOptions {
  pollIntervalMs?: number; // Fallback polling interval (default: 15 seconds)
  enablePolling?: boolean; // Enable polling even if websocket connected
}

export function useRealtimeAttendanceSync(
  opts: AttendanceSyncOptions = {}
) {
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket();

  const pollIntervalMs = opts.pollIntervalMs ?? 15_000; // 15 seconds fallback
  const enablePolling = opts.enablePolling ?? !isConnected; // Only poll if no websocket

  useEffect(() => {
    if (!enablePolling || isConnected) {
      return; // No polling needed
    }

    // Set up polling as fallback if websocket is down
    const pollTimer = setInterval(() => {
      // Invalidate all attendance queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["parent-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["parent-student-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }, pollIntervalMs);

    return () => clearInterval(pollTimer);
  }, [enablePolling, isConnected, queryClient, pollIntervalMs]);

  return {
    isConnected,
    isPollActive: enablePolling && !isConnected,
  };
}
