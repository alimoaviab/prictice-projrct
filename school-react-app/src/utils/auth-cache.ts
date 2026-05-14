/**
 * Ported from old-app/school-app/utils/auth-cache.ts.
 *
 * CRITICAL: Multi-tenant cache management. Clears all cached state on logout
 * or when the active school changes, preventing data leakage between tenants.
 */

export function clearAllCaches(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    const keysToKeep = ["theme", "language"];
    const preserved: Record<string, string> = {};

    keysToKeep.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });

    localStorage.clear();

    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  if (typeof window !== "undefined" && window.sessionStorage) {
    sessionStorage.clear();
  }

  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

export function clearReactQueryCache(): void {
  if (typeof window !== "undefined" && (window as unknown as { queryClient?: { clear: () => void } }).queryClient) {
    (window as unknown as { queryClient: { clear: () => void } }).queryClient.clear();
  }
}

export function clearZustandCache(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("zustand-") || key.includes("-storage")) {
        localStorage.removeItem(key);
      }
    });
  }
}

export function performSecureLogout(): void {
  clearAllCaches();
  clearReactQueryCache();
  clearZustandCache();

  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

export function verifySchoolContext(currentSchoolId: string): boolean {
  if (typeof window === "undefined") return true;

  const cachedSchoolId = localStorage.getItem("last_school_id");

  if (cachedSchoolId && cachedSchoolId !== currentSchoolId) {
    console.warn("[Security] School context changed. Clearing caches.");
    clearAllCaches();
    localStorage.setItem("last_school_id", currentSchoolId);
    return false;
  }

  localStorage.setItem("last_school_id", currentSchoolId);
  return true;
}
