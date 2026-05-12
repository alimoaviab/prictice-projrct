import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Role = "admin" | "super_admin" | "teacher" | "parent" | "student";

interface User {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const profileId = localStorage.getItem("profile_id") || undefined;
    const classId = localStorage.getItem("class_id") || undefined;
    const studentId = localStorage.getItem("student_id") || undefined;

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const payload = decodeJwtPayload(token);
      
      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }
      
      setUser({
        id: payload.sub,
        email: payload.actor_email,
        role: payload.role,
        schoolId: payload.school_id,
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
    localStorage.removeItem("token");
    localStorage.removeItem("profile_id");
    localStorage.removeItem("class_id");
    localStorage.removeItem("student_id");
    localStorage.removeItem("last_school_id");
    
    // Clear all other localStorage items except theme/language
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
