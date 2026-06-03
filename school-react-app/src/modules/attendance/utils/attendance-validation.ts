/**
 * Attendance State Validation
 *
 * Enforces business rules:
 *   1. Never revert from PRESENT/ABSENT back to UNMARKED
 *   2. Each student+date+academic_year must have exactly one record
 *   3. Only valid status transitions are allowed
 */

export type AttendanceStatus = "unmarked" | "present" | "absent" | "late" | "excused";

/**
 * Validates a state transition. Prevents reversions.
 * 
 * @param currentStatus - The current status (or undefined if no record)
 * @param newStatus - The status being set
 * @returns true if transition is valid, false otherwise
 * 
 * Valid transitions:
 *   - unmarked → present ✓
 *   - unmarked → absent ✓
 *   - present → absent ✓
 *   - absent → present ✓
 *   - (no record) → present ✓
 *   - (no record) → absent ✓
 * 
 * Invalid transitions (prevented):
 *   - present → unmarked ✗
 *   - absent → unmarked ✗
 */
export function isValidAttendanceTransition(
  currentStatus: AttendanceStatus | undefined,
  newStatus: AttendanceStatus
): boolean {
  const markedStatuses: AttendanceStatus[] = ["present", "absent", "late", "excused"];

  // No current status = always valid (new record)
  if (!currentStatus || currentStatus === "unmarked") {
    return markedStatuses.includes(newStatus);
  }

  // From marked status, only allow transition to other marked status
  // Never allow transition back to unmarked
  if (markedStatuses.includes(currentStatus)) {
    return markedStatuses.includes(newStatus);
  }

  return false;
}

/**
 * Normalizes attendance data from API response.
 * Ensures consistent shape across different response formats.
 */
export function normalizeAttendanceRecord(raw: any): {
  status: AttendanceStatus;
  date: string;
  student_id: string;
} {
  return {
    status: (raw.status || "unmarked").toLowerCase() as AttendanceStatus,
    date: raw.date || new Date().toISOString().split("T")[0],
    student_id: raw.student_id || "",
  };
}

/**
 * Validates attendance uniqueness constraint.
 * Ensures no duplicate records for same student+date+academic_year.
 */
export function validateAttendanceUniqueness(
  records: Array<{
    student_id: string;
    date: string;
    academic_year_id?: string;
  }>
): boolean {
  const seen = new Set<string>();
  for (const record of records) {
    const key = `${record.student_id}#${record.date}#${record.academic_year_id || "default"}`;
    if (seen.has(key)) {
      return false; // Duplicate found
    }
    seen.add(key);
  }
  return true;
}
