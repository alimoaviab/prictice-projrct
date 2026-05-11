"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import InteractiveCharacters from "@/components/auth/InteractiveCharacters";

type Role = "admin" | "teacher" | "student";

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: "admin", label: "Admin", icon: "admin_panel_settings" },
  { key: "teacher", label: "Teacher", icon: "local_library" },
  { key: "student", label: "Student", icon: "face" },
];

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
};

function decodeJwtPayload(token: string): { role?: string } | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) {
    return null;
  }

  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  // Animation States
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (token) {
      const payload = decodeJwtPayload(token);
      router.replace(ROLE_ROUTES[payload?.role || "admin"] || "/admin/dashboard");
      return;
    }
    setSessionChecked(true);
  }, [router]);

  if (!sessionChecked) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    
    // Trigger typing animation
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 200);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: selectedRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      setSuccess(true);
      localStorage.setItem("token", result.token);
      if (result.profile_id) localStorage.setItem("profile_id", result.profile_id);
      else localStorage.removeItem("profile_id");
      if (result.class_id) localStorage.setItem("class_id", result.class_id);
      else localStorage.removeItem("class_id");
      if (result.student_id) localStorage.setItem("student_id", result.student_id);
      else localStorage.removeItem("student_id");
      
      setTimeout(() => {
        router.push(ROLE_ROUTES[result.role] || "/");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-[480px] relative">
        {/* Characters Component */}
        <InteractiveCharacters 
          isPasswordFocused={isPasswordFocused}
          isUsernameHovered={isEmailHovered}
          isTyping={isTyping}
          isSuccess={success}
        />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-6 md:p-9 relative z-10"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back!</h2>
            <p className="text-gray-400 font-semibold normal-case tracking-[0.15em] text-xs">Log in to continue</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-10 p-1.5 bg-slate-50/50 backdrop-blur-sm rounded-2xl flex border border-slate-100/50 shadow-inner">
            {ROLES.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelectedRole(role.key)}
                className={`flex-1 py-4 px-2 rounded-xl text-xs font-black transition-all duration-500 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                  selectedRole === role.key
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {selectedRole === role.key && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-[0_8px_20px_rgba(37,99,235,0.08)] border border-blue-50/50 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`material-symbols-outlined text-[20px] relative z-10 transition-transform duration-500 ${selectedRole === role.key ? 'scale-110' : ''}`}>
                  {role.icon}
                </span>
                <span className="relative z-10 uppercase tracking-[0.1em]">{role.label}</span>
              </button>
            ))}
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Email Address</label>
              <div 
                className="relative group"
                onMouseEnter={() => setIsEmailHovered(true)}
                onMouseLeave={() => setIsEmailHovered(false)}
              >
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@school.com"
                  className="w-full h-12 pl-6 pr-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Password</label>
              <div className="relative group">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-6 pr-14 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-600 font-bold">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50 ${success ? 'bg-green-500 shadow-[0_10px_20px_rgba(34,197,94,0.2)]' : ''}`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : success ? (
                <>
                  <span className="normal-case ">Authenticated!</span>
                  <span className="material-symbols-outlined">check_circle</span>
                </>
              ) : (
                <>
                  <span className="normal-case ">Sign In</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-400 font-bold text-sm">
              New here?{" "}
              <Link href="/auth/signup" className="text-blue-600 hover:underline decoration-2 underline-offset-8">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}