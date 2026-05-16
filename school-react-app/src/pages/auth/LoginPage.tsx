/**
 * Ported from old-app/school-app/app/auth/login/page.tsx.
 *
 * Replacements:
 *   - next/link, next/navigation → react-router-dom (Link, useNavigate)
 *   - InteractiveCharacters component is imported from a placeholder; replace
 *     with the real port when porting components/auth.
 *
 * Behaviour, copy, and form logic preserved verbatim. POST /api/auth/login
 * accepts the same body and returns the same shape as the original endpoint.
 */

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InteractiveCharacters from "@/components/auth/InteractiveCharacters";
import { decodeJwtPayload } from "@/utils/jwt";

type Role = "admin" | "teacher" | "student";

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: "admin", label: "Admin", icon: "admin_panel_settings" },
  { key: "teacher", label: "Teacher", icon: "local_library" },
  { key: "student", label: "Parent Portal", icon: "family_restroom" },
];

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  student: "/student/dashboard",
};

function resolveRoleRoute(role?: string): string {
  const normalizedRole = (role || "").toLowerCase();
  return ROLE_ROUTES[normalizedRole] || "/admin/dashboard";
}

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Animation states
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (token) {
      const payload = decodeJwtPayload(token);
      navigate(resolveRoleRoute(payload?.role), { replace: true });
      return;
    }
    setSessionChecked(true);
  }, [navigate]);

  if (!sessionChecked) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 200);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      const payload = result?.data && typeof result.data === "object" ? result.data : result;

      if (!response.ok) {
        const friendly =
          response.status === 401
            ? "The email or password you entered is incorrect."
            : response.status === 429
              ? "Too many sign-in attempts. Please wait a moment and try again."
              : response.status >= 500
                ? "We can't reach the sign-in service right now. Please try again shortly."
                : (result?.message || "We couldn't sign you in. Please check your details and try again.");
        throw new Error(friendly);
      }

      setSuccess(true);
      if (payload?.token) {
        localStorage.setItem("token", payload.token);
      }
      if (payload?.profile_id) localStorage.setItem("profile_id", payload.profile_id);
      else localStorage.removeItem("profile_id");
      if (payload?.class_id) localStorage.setItem("class_id", payload.class_id);
      else localStorage.removeItem("class_id");
      if (payload?.student_id) localStorage.setItem("student_id", payload.student_id);
      else localStorage.removeItem("student_id");

      setTimeout(() => {
        const targetRole = payload?.role || selectedRole;
        navigate(resolveRoleRoute(targetRole));
      }, 1500);
    } catch (err: unknown) {
      const e = err as Error | undefined;
      const isNetwork =
        e?.name === "TypeError" || /fetch|network/i.test(String(e?.message || ""));
      setError(
        isNetwork
          ? "Couldn't reach the server. Please check your internet connection and try again."
          : e?.message || "We couldn't sign you in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-[480px] relative">
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
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/70">
              <img src="/logo.jpeg" alt="Eduplexo" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Welcome Back!</h2>
            <p className="text-gray-400 font-semibold normal-case tracking-[0.15em] text-xs">Log in to continue</p>
          </div>

          <div className="mb-10 p-1.5 bg-slate-50/50 backdrop-blur-sm rounded-2xl flex border border-slate-100/50 shadow-inner">
            {ROLES.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => setSelectedRole(role.key)}
                className={`flex-1 py-4 px-2 rounded-xl text-xs font-black transition-all duration-500 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden ${
                  selectedRole === role.key ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {selectedRole === role.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white shadow-[0_8px_20px_rgba(37,99,235,0.08)] border border-blue-50/50 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`material-symbols-outlined text-[20px] relative z-10 transition-transform duration-500 ${selectedRole === role.key ? "scale-110" : ""}`}>
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
              className={`w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50 ${success ? "bg-green-500 shadow-[0_10px_20px_rgba(34,197,94,0.2)]" : ""}`}
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
              <Link to="/auth/signup" className="text-blue-600 hover:underline decoration-2 underline-offset-8">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
