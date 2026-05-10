"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Role = "admin" | "teacher" | "parent";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (token) {
      router.replace("/admin/dashboard");
      return;
    }
    setSessionChecked(true);
  }, [router]);

  if (!sessionChecked) return null;

  const roles: { key: Role; label: string; icon: string }[] = [
    { key: "admin", label: "Admin", icon: "admin_panel_settings" },
    { key: "teacher", label: "Teacher", icon: "local_library" },
    { key: "parent", label: "Parent", icon: "family_restroom" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      if (data.profile_id) localStorage.setItem("profile_id", data.profile_id);
      if (data.class_id) localStorage.setItem("class_id", data.class_id);
      if (data.student_id) localStorage.setItem("student_id", data.student_id);

      if (data.role === "admin" || data.role === "super_admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (data.role === "parent") {
        router.push("/parent/dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-8">
      <div className="w-full max-w-[1200px] bg-white rounded-[2rem] shadow-2xl flex flex-col lg:flex-row relative z-10 border border-slate-100/60">

        {/* LEFT SIDE: Brand & SaaS Showcase */}
        <div className="lg:w-5/12 bg-[#0F172A] relative hidden lg:flex flex-col p-12 text-white overflow-hidden rounded-l-[2rem]">
          {/* Background effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[80px]"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-12"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-xl">school</span>
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                EduFlow
              </span>
            </motion.div>

            {/* Value Prop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4"
            >
              <h1 className="text-4xl font-extrabold leading-[1.15] mb-6 tracking-tight text-white">
                The modern operating system for your school.
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-12">
                Experience a secure, seamless, and deeply integrated platform designed to elevate education management.
              </p>
            </motion.div>

            {/* Dynamic UI Showcase */}
            <div className="flex-1 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute top-0 left-0 right-[-40px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-400">trending_up</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">Daily Attendance</h3>
                      <p className="text-xs text-slate-400">School-wide metrics</p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-white">98.2%</span>
                </div>
                {/* Mock Chart line */}
                <div className="h-12 w-full flex items-end gap-2">
                  {[40, 60, 50, 80, 70, 90, 85, 100].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                      className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-400/80 rounded-t-sm"
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute top-[150px] right-[-20px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-64"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-amber-400 text-lg">notifications_active</span>
                  <p className="text-sm font-medium text-slate-200">New Enrollment</p>
                </div>
                <p className="text-xs text-slate-400">Sarah Jenkins was added to Class 4B.</p>
              </motion.div>
            </div>

            {/* Default Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-auto relative z-10 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                  Demo Access
                </p>
                <div className="flex gap-4">
                  <p className="text-sm text-slate-300"><span className="text-slate-500">U:</span> admin@school.com</p>
                  <p className="text-sm text-slate-300"><span className="text-slate-500">P:</span> admin123</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ email: 'admin@school.com', password: 'admin123' })}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                title="Fill demo credentials"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="lg:w-7/12 p-6 sm:p-12 lg:p-16 flex flex-col justify-center bg-white rounded-[2rem] lg:rounded-l-none relative z-20">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-xl">school</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              EduFlow
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-slate-500 font-medium">Log in to your secure portal to continue.</p>
          </motion.div>

          {/* Role Segmented Control */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
              {roles.map((role) => {
                const isActive = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className="relative flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 z-10 cursor-pointer"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRoleBg"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span className={`relative z-20 flex items-center gap-2 ${isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                      <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                      <span className="hidden sm:inline">{role.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    mail
                  </span>
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@school.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors duration-200">
                    lock
                  </span>
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 cursor-pointer" />
                <label htmlFor="remember" className="text-sm font-medium text-slate-600 select-none cursor-pointer">Remember me</label>
              </div>
              <Link href="/auth/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none mt-4 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-[15px]">Sign in to portal</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-2"
          >
            <span className="text-sm font-medium text-slate-500">Don't have an account?</span>
            <Link href="/auth/signup" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Create a workspace
            </Link>
          </motion.div>
        </div>

      </div>

      {/* Required custom CSS for the shimmer effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
