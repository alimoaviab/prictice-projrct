import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type Role = "admin" | "super_admin" | "teacher" | "parent";

interface User {
  id: string;
  email: string;
  role: Role;
  profileId?: string;
  classId?: string;
  studentId?: string;
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
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.sub,
        email: payload.actor_email,
        role: payload.role,
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
    localStorage.removeItem("token");
    setUser(null);
    router.push("/auth/login");
  };

  return { user, loading, logout };
}
