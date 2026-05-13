import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Role = "admin" | "super_admin" | "teacher" | "parent" | "student";

interface User {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  activeAcademicYearId?: string;
  profileId?: string;
  classId?: string;
  studentId?: string;
}

function decodeJwtPayload(token: string): any {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    throw new Error("Invalid token format");
  }

  const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

/**
 * CRITICAL: Cross-tenant guard.
 * If the school_id of the active token differs from the previously seen
 * school_id, wipe all role/profile-bound caches BEFORE the page consumes
 * stale data. Runs synchronously before state hydrates.
 */
function enforceSchoolBoundary(currentSchoolId: string) {
  if (typeof window === "undefined") return;

  const lastSchoolId = localStorage.getItem("last_school_id");
  if (lastSchoolId && lastSchoolId !== currentSchoolId) {
    // Tenant switched on this browser — clear ALL non-essential cached state.
    const keysToKeep = new Set(["theme", "language", "token", "last_school_id"]);
    const preserved: Record<string, string> = {};
    keysToKeep.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });
    localStorage.clear();
    Object.entries(preserved).forEach(([key, value]) => localStorage.setItem(key, value));
    sessionStorage.clear();
  }
  localStorage.setItem("last_school_id", currentSchoolId);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const payload = decodeJwtPayload(token);
      const email = payload.actor_email || payload.email || "";

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }

      // CRITICAL: Detect and clear cross-tenant cached state
      enforceSchoolBoundary(payload.school_id);

      // Migrate selected academic year to school-scoped storage if needed
      const scopedKey = `academic_year_id:${payload.school_id}`;
      const scopedYear = localStorage.getItem(scopedKey);
      if (!scopedYear && payload.active_academic_year_id) {
        localStorage.setItem(scopedKey, payload.active_academic_year_id);
      }
      // Mirror into the legacy global key for backward compatibility with
      // existing API request headers; the backend re-validates anyway.
      const effectiveYear = scopedYear || payload.active_academic_year_id || "";
      if (effectiveYear) {
        localStorage.setItem("academic_year_id", effectiveYear);
      } else {
        localStorage.removeItem("academic_year_id");
      }

      const profileId = localStorage.getItem("profile_id") || undefined;
      const classId = localStorage.getItem("class_id") || undefined;
      const studentId = localStorage.getItem("student_id") || undefined;

      setUser({
        id: payload.sub,
        email,
        role: payload.role,
        schoolId: payload.school_id,
        activeAcademicYearId: effectiveYear || payload.active_academic_year_id,
        profileId,
        classId,
        studentId
      });
    } catch (e) {
      console.error("Failed to decode token", e);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    // CRITICAL: Clear all caches to prevent data leakage between schools
    const keysToKeep = ["theme", "language"];
    const preserved: Record<string, string> = {};
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });
    localStorage.clear();
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    setUser(null);
    router.push("/auth/login");
  };

  return { user, loading, logout };
}
