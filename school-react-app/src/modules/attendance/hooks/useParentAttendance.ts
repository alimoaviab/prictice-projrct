/**
 * useParentAttendance — React Query-based parent attendance with real-time cache invalidation.
 *
 * Replaces raw fetch + useState to enable:
 *   - Automatic cache invalidation when attendance changes (via websocket)
 *   - Real-time updates across parent portal without page reload
 *   - Cross-portal consistency (admin/teacher changes instantly visible to parent)
 *   - Automatic refetch on network reconnect
 */

import { useQuery } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent" | "unmarked";
}

export interface ParentAttendanceSummary {
  student_id: string;
  student_name: string;
  class_name: string;
  total_present: number;
  total_absent: number;
  percentage: number;
  recent_records: AttendanceRecord[];
}

const parentAttendanceQueryKey = (studentId: string) => [
  "parent-attendance",
  { student_id: studentId },
];

/**
 * Fetch parent attendance data for a specific student.
 * Automatically refetches when websocket broadcasts attendance changes.
 */
export function useParentAttendance(studentId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: parentAttendanceQueryKey(studentId || ""),
    queryFn: async () => {
      if (!studentId) throw new Error("No student selected");

      const res = await serviceRequest<any>(
        `/api/parent/student-attendance?student_id=${encodeURIComponent(
          studentId
        )}`
      );

      if (!res.ok) {
        throw new Error(res.error?.message || "Failed to load attendance");
      }

      if (!res.data) {
        return {
          student_id: studentId,
          student_name: "",
          class_name: "",
          total_present: 0,
          total_absent: 0,
          percentage: 0,
          recent_records: [],
        };
      }

      // Normalize the API response
      const summary = res.data.attendance_summary || {};
      return {
        student_id: studentId,
        student_name: res.data.student || "",
        class_name: res.data.class || "",
        total_present: Number(summary.present_days || 0),
        total_absent: Number(summary.absent_days || 0),
        percentage: Number(summary.attendance_percentage || 0),
        recent_records: Array.isArray(res.data.recent_records)
          ? res.data.recent_records.map((r: any) => ({
              date: r.date,
              status: r.status || "unmarked",
            }))
          : [],
      } as ParentAttendanceSummary;
    },
    enabled: !!studentId,
    // Refetch when window regains focus (network reconnect)
    refetchOnWindowFocus: true,
    // Refetch every 30 seconds for consistency
    refetchInterval: 30000,
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
