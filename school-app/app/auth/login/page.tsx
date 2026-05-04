"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F4F8]">
      <div className="max-w-[1000px] w-full bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-100">
        {/* Left Branding Panel */}
        <div className="md:w-5/12 bg-[#1E3A8A] p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="material-symbols-outlined text-4xl text-[#3B82F6]">school</span>
              <span className="text-2xl font-bold tracking-tight">EduFlow</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Empowering Education through Innovation
            </h1>
            <p className="text-blue-100 opacity-80 leading-relaxed">
              Experience the next generation of school management. Secure, efficient, and beautifully simple.
            </p>
          </div>

          <div className="relative z-10 mt-12 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-2">Default Admin</p>
            <p className="text-sm font-medium">Email: <span className="text-blue-200">admin@school.com</span></p>
            <p className="text-sm font-medium">Pass: <span className="text-blue-200">admin123</span></p>
          </div>
        </div>

        {/* Right Login Panel */}
        <div className="md:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Please sign in to access your portal</p>
          </div>

          {/* Role Tabs */}
          <div className="mb-8">
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              {roles.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedRole === role.key
                      ? "bg-white text-[#1E3A8A] shadow-lg"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                  <span className="hidden sm:inline">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-[#1E3A8A] transition-colors">
                  mail
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@school.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#1E3A8A] transition-all outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 group-focus-within:text-[#1E3A8A] transition-colors">
                  lock
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#1E3A8A] transition-all outline-none text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A8A] hover:bg-[#152963] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/auth/forgot-password" size="sm" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">New here?</span>
              <Link href="/auth/signup" className="text-sm font-bold text-[#1E3A8A] hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}