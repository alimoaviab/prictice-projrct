/**
 * CRITICAL: Frontend Cache Management for Multi-Tenant Security
 * 
 * This utility ensures no data leakage between schools by clearing
 * all cached data on logout/login.
 */

/**
 * Clear all authentication and data caches
 * Call this on logout to prevent data leakage
 */
export function clearAllCaches(): void {
  // Clear localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    // Keep only essential non-sensitive items
    const keysToKeep = ["theme", "language"];
    const preserved: Record<string, string> = {};
    
    keysToKeep.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) preserved[key] = value;
    });
    
    localStorage.clear();
    
    // Restore preserved items
    Object.entries(preserved).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }

  // Clear sessionStorage completely
  if (typeof window !== "undefined" && window.sessionStorage) {
    sessionStorage.clear();
  }

  // Clear cookies (auth tokens)
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

/**
 * Clear React Query cache
 * Call this after logout to prevent stale data
 */
export function clearReactQueryCache(): void {
  // If using React Query, clear its cache
  if (typeof window !== "undefined" && (window as any).queryClient) {
    (window as any).queryClient.clear();
  }
}

/**
 * Clear Zustand persisted state
 * Call this on logout if using Zustand with persistence
 */
export function clearZustandCache(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    // Remove all zustand persisted stores
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("zustand-") || key.includes("-storage")) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Complete logout cleanup
 * Call this function on logout to ensure complete data isolation
 */
export function performSecureLogout(): void {
  clearAllCaches();
  clearReactQueryCache();
  clearZustandCache();
  
  // Force reload to clear any in-memory state
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

/**
 * Verify school context on app load
 * Prevents using cached data from different school
 */
export function verifySchoolContext(currentSchoolId: string): boolean {
  if (typeof window === "undefined") return true;
  
  const cachedSchoolId = localStorage.getItem("last_school_id");
  
  if (cachedSchoolId && cachedSchoolId !== currentSchoolId) {
    // School changed! Clear everything
    console.warn("[Security] School context changed. Clearing caches.");
    clearAllCaches();
    localStorage.setItem("last_school_id", currentSchoolId);
    return false;
  }
  
  localStorage.setItem("last_school_id", currentSchoolId);
  return true;
}
