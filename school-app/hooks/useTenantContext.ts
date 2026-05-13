"use client";

/**
 * Read the currently-active tenant context (school_id + academic_year_id)
 * from the auth state on the client. Used to:
 *
 *  1. Compose React Query keys so a school or year switch automatically
 *     misses cached data from the previous context.
 *  2. Inject sensible defaults into list URLs.
 *
 * The values are derived from the JWT payload that useAuth already decodes
 * and from the school-scoped academic_year_id stored in localStorage.
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
              window.localStorage.getItem(`academic_year_id:${user?.schoolId ?? ""}`) ||
              window.localStorage.getItem("academic_year_id") ||
              ""
            : user?.activeAcademicYearId) || "";

    return {
        schoolId: user?.schoolId ?? "",
        academicYearId: academicYearId,
        role: user?.role ?? ""
    };
}
