/**
 * Ported from old-app/school-app/app/auth/signup/page.tsx. Same form, same
 * copy, same submit logic. POST /api/auth/signup body matches the original.
 */

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InteractiveCharacters from "@/components/auth/InteractiveCharacters";

type Role = "admin" | "teacher" | "student";

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: "admin", label: "Admin", icon: "admin_panel_settings" },
  { key: "teacher", label: "Teacher", icon: "local_library" },
  { key: "student", label: "Student", icon: "face" },
];

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolName: "",
    schoolCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation states
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 200);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: selectedRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        const friendly =
          response.status === 409
            ? (result?.error?.message ||
              "An account with these details already exists. Please sign in instead.")
            : response.status === 400
              ? (result?.error?.message ||
                "Some of the information you entered isn't valid. Please review and try again.")
              : response.status >= 500
                ? "We can't reach the sign-up service right now. Please try again shortly."
                : (result?.error?.message ||
                  "We couldn't create your account. Please check your details and try again.");
        throw new Error(friendly);
      }

      navigate("/auth/login");
    } catch (err: unknown) {
      const e = err as Error | undefined;
      const isNetwork =
        e?.name === "TypeError" || /fetch|network/i.test(String(e?.message || ""));
      setError(
        isNetwork
          ? "Couldn't reach the server. Please check your internet connection and try again."
          : e?.message || "We couldn't create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden py-12">
      <div className="w-full max-w-[600px] relative">
        <InteractiveCharacters
          isPasswordFocused={isPasswordFocused}
          isUsernameHovered={isEmailHovered}
          isTyping={isTyping}
          isSuccess={false}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-6 md:p-9 relative z-10"
        >
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Create Account</h2>
              <p className="text-gray-400 font-semibold normal-case tracking-[0.15em] text-xs">Join the Eduplexo network</p>
            </div>

            <div className="mb-10 p-1.5 bg-gray-50 rounded-2xl flex border border-gray-100">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`flex-1 py-3.5 px-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedRole === role.key
                      ? "bg-white text-blue-600 shadow-sm border border-gray-100 scale-[1.02]"
                      : "text-gray-400 hover:text-gray-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                  <span className="normal-case ">{role.label}</span>
                </button>
              ))}
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Full Legal Name</label>
                  <input
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Johnathan Doe"
                    className="w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">
                    {selectedRole === "admin" ? "School Entity" : "Access Code"}
                  </label>
                  <input
                    name={selectedRole === "admin" ? "schoolName" : "schoolCode"}
                    required
                    value={selectedRole === "admin" ? formData.schoolName : formData.schoolCode}
                    onChange={handleChange}
                    placeholder={selectedRole === "admin" ? "Academy Name" : "SCH-XXXX"}
                    className={`w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300 ${selectedRole !== "admin" ? "font-mono normal-case  text-blue-600" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Work Email Address</label>
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
                    placeholder="name@eduplexo.com"
                    className="w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Security Key</label>
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
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 normal-case  ml-2">Verify Key</label>
                  <div className="relative group">
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-6 pr-14 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
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
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="normal-case ">Register Profile</span>
                    <span className="material-symbols-outlined">person_add</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-400 font-bold text-sm">
                Already part of the family?{" "}
                <Link to="/auth/login" className="text-blue-600 hover:underline decoration-2 underline-offset-8">
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
