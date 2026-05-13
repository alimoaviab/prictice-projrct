"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const token = typeof window !== "undefined" ? window.localStorage.getItem("super_admin_token") : null;
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

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

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Login failed");
      }

      setSuccess(true);
      if (result.data?.token) {
        localStorage.setItem("super_admin_token", result.data.token);
      }

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-gray-100 p-8 md:p-10"
        >
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30 mb-4"
            >
              <span className="material-symbols-outlined text-white text-[32px]">
                shield_person
              </span>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
              Super Admin
            </h2>
            <p className="text-gray-500 font-semibold text-xs tracking-[0.2em] uppercase">
              Eduplexo Control Panel
            </p>
          </div>

          {/* Security Badge */}
          <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">
              lock
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                Restricted Access
              </p>
              <p className="text-[10px] text-amber-700 font-medium">
                Unauthorized access attempts are logged
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                Admin Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                  mail
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@eduplexo.com"
                  className="w-full h-12 pl-11 pr-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-semibold placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                Security Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                  key
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full h-12 pl-11 pr-12 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-semibold placeholder:text-gray-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-red-500 text-[18px]">
                  error
                </span>
                <p className="text-xs text-red-600 font-semibold">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 ${
                success
                  ? "from-green-500 to-emerald-600 shadow-[0_10px_20px_rgba(34,197,94,0.3)]"
                  : ""
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : success ? (
                <>
                  <span className="uppercase tracking-wider">Access Granted</span>
                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">
                    shield
                  </span>
                  <span className="uppercase tracking-wider">Access Control Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="h-px w-12 bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Platform Security
              </span>
              <div className="h-px w-12 bg-gray-200" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              Internal access only. All activity is monitored and logged.
            </p>
          </div>
        </motion.div>

        {/* Version Info */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-white/40 font-medium">
            Eduplexo Enterprise • v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
