"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Role = "admin" | "teacher" | "student" | "parent";

export default function SignupPage() {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    schoolName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (isDevelopment) {
      router.replace("/admin/dashboard");
    }
  }, [isDevelopment, router]);

  if (isDevelopment) {
    return null;
  }

  const roles: { key: Role; label: string; icon: string }[] = [
    { key: "admin", label: "Admin", icon: "admin_panel_settings" },
    { key: "teacher", label: "Teacher", icon: "local_library" },
    { key: "student", label: "Student", icon: "face" },
    { key: "parent", label: "Parent", icon: "family_restroom" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.schoolName.trim()) {
      setError("School name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email address is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          schoolName: formData.schoolName,
          email: formData.email,
          password: formData.password,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Signup failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);

      // Route based on role
      const roleRoutes: Record<Role, string> = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
        parent: "/parent/dashboard",
      };
      router.push(roleRoutes[selectedRole] || "/student/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper for password strength UI
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };
  const strength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-8">
      <div className="w-full max-w-[1200px] bg-white rounded-[2rem] shadow-2xl flex flex-col lg:flex-row relative z-10 border border-slate-100/60 overflow-hidden">

        {/* LEFT SIDE: Visuals & Onboarding Hero */}
        <div className="lg:w-5/12 relative hidden lg:flex flex-col justify-between p-12 text-white bg-[#0F172A] overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[80px]"></div>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAdyCVNz6vSHSwd-rbVf0kNpJo4k3G6lwGMOU2f17VDvcWZJtLKw3ZHGTyOnokhzFqY9DdOCxtNtEmxGvLTdugN_G-shZ8ZwbBeNn2oBPuMOh59-lZtOpcHr908UPYxXmys7LpMhBEoOUQUJpjnFwOCn5Y_LvWWPD_pmFMlfbONWwZ5mwwMEIjAEHY8l-kjhiKhmMcPtuBXIlsVmtARyw5rnDPangYmHCvt8dY4OuZJefzAP2yXpmmLpeW1Cx_EKBSR3VJrwRKNTk"
              alt="Education Campus"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-xl">school</span>
              </div>
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                EduFlow
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-4xl font-extrabold leading-[1.15] mb-6 tracking-tight">
                Create your school workspace.
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
                Join thousands of leading educational institutions leveraging EduFlow to manage, analyze, and grow.
              </p>
            </motion.div>
          </div>

          {/* Social Proof / Metrics overlay */}
          <div className="relative z-10 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400">verified</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Enterprise-Grade Security</p>
                <p className="text-xs text-slate-400">Your institution's data is encrypted and safe.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400">speed</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Quick Setup</p>
                <p className="text-xs text-slate-400">Be fully operational in less than an hour.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE: Signup Form Container */}
        <div className="lg:w-7/12 p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-center bg-white relative z-20 h-full lg:h-[800px] overflow-y-auto custom-scrollbar">

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
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Get Started</h2>
            <p className="text-slate-500 font-medium">Create your account to setup your school platform.</p>
          </motion.div>

          {/* Role Segmented Control */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 flex-wrap sm:flex-nowrap">
              {roles.map((role) => {
                const isActive = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className="relative flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-colors duration-200 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 z-10 min-w-[70px] cursor-pointer"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="signupRoleBg"
                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <span className={`relative z-20 flex items-center gap-1.5 ${isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{role.icon}</span>
                      <span className="text-xs sm:text-sm">{role.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-semibold text-slate-700 ml-1">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-blue-600 transition-colors">person</span>
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="schoolName" className="text-sm font-semibold text-slate-700 ml-1">
                  School Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-blue-600 transition-colors">apartment</span>
                  </div>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    placeholder="Greenwood Academy"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">
                Work Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-blue-600 transition-colors">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@school.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-blue-600 transition-colors">lock</span>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {/* Password Strength UI */}
                {formData.password.length > 0 && (
                  <div className="flex gap-1 mt-2 px-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          strength >= level
                            ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-blue-400' : 'bg-emerald-500')
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[20px] text-slate-400 group-focus-within:text-blue-600 transition-colors">lock_reset</span>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-3 bg-slate-50 border rounded-xl focus:bg-white focus:ring-4 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-400 shadow-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
                        : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-emerald-300 focus:ring-emerald-500/10 focus:border-emerald-500'
                          : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 overflow-hidden"
                >
                  <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-xl shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-[15px]">Create Account</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>

          {/* Social Sign In Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Or continue with</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <img
                  alt="Google"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdsze_pcqlboVH2C3WtneIkX8_RHKCPeUclqeHO3QUZayHlfv2erQ_qNpcIXMDo6AWmGqWDdIh0UfYCUpvYt7XwBTX2cUhFybTb5NTYrQ9MSiBtDWV5qG9a_PyD1HAPaerGag2OhH1RFYS4bKRwGClyovjEwOChHoITmoalmUi3OH9TVkkUAEmzc3Hu0QDZkrCCT9x5inZs3Bt5ZNl4GuGks8AVmNYG2lHHHOzmk4xenlQ3NuUuLeYmqRLHn2XB8huX9PcWQRSSpE"
                />
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <img
                  alt="Microsoft"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuANZI9cNyZV1UhmF5iHFvFoXcmV2rWQhsEe97Pm92Hs_XbZvj9Gw_6XLaksYhOmaReBnvrlLVx_qvy6H0f-cVNEF1gcRLucB9OKeBbNxhTKADG1ze3Y1GY0io8AbiAXyNGoARWd34gS72FBvmc0U57W4npYR6LjTxT8ew_fTni0_N5QWL5cP0_TBx-THcACYdsPJ7PVw0doyem3E0Ey-Sfxv1JEc--UMJWmq-eT9PS--KsGKHFbno3dZrFn_iG2EMjtlZBJc2MQdds"
                />
                Microsoft
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <span className="text-sm font-medium text-slate-500">Already have an account? </span>
            <Link href="/auth/login" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Sign In here
            </Link>
          </motion.div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
