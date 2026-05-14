/**
 * Ported from old-app/school-app/hooks/useTenantContext.ts.
 *
 * Reads the active tenant context (school_id + academic_year_id) and exposes
 * it for query-key composition and URL building.
 */

import { useAuth } from "./useAuth";

export type TenantContext = {
  schoolId: string;
  academicYearId: string;
  role: string;
};

export function useTenantContext(): TenantContext {
  const { user } = useAuth();
  const academicYearId =
    (typeof window !== "undefined"
      ? user?.activeAcademicYearId ||
        window.localStorage.getItem(
          `academic_year_id:${user?.schoolId ?? ""}`
        ) ||
        window.localStorage.getItem("academic_year_id") ||
        ""
      : user?.activeAcademicYearId) || "";

  return {
    schoolId: user?.schoolId ?? "",
    academicYearId,
    role: user?.role ?? "",
  };
}
