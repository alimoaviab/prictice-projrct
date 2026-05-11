"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveCharacters from "@/components/auth/InteractiveCharacters";

type Role = "admin" | "teacher" | "student";

const ROLES: { key: Role; label: string; icon: string }[] = [
  { key: "admin", label: "Admin", icon: "admin_panel_settings" },
  { key: "teacher", label: "Teacher", icon: "local_library" },
  { key: "student", label: "Student", icon: "face" },
];

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolName: "",
    schoolCode: "",
  });

  // Animation States
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    
    // Trigger typing animation
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        throw new Error(result.error?.message || "Signup failed");
      }

      setSuccess(true);
      if (result.data.schoolCode) {
        setGeneratedCode(result.data.schoolCode);
      }
      
      if (!result.data.schoolCode) {
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden py-12">
      <div className="w-full max-w-[600px] relative">
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
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                  <span className="material-symbols-outlined text-green-500 text-[64px]">check_circle</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4">Registration Successful!</h2>
                <p className="text-gray-500 font-bold mb-10">{success ? "Welcome to the future of education." : ""}</p>
                
                {generatedCode && (
                  <div className="bg-gray-50 border-2 border-gray-100 rounded-[32px] p-8 mb-10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Your School Join Code</p>
                    <div className="flex items-center justify-center gap-6">
                      <span className="text-5xl font-mono font-black text-blue-600 tracking-tighter">{generatedCode}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          alert("Code copied!");
                        }}
                        className="p-4 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[24px] text-gray-400">content_copy</span>
                      </button>
                    </div>
                  </div>
                )}

                <Link 
                  href="/auth/login" 
                  className="inline-block px-12 py-5 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 shadow-xl transition-all"
                >
                  Proceed to Login
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Create Account</h2>
                  <p className="text-gray-400 font-semibold uppercase tracking-[0.15em] text-xs">Join the Eduplexo network</p>
                </div>

                {/* Role Selection Tabs */}
                <div className="mb-10 p-1.5 bg-gray-50 rounded-2xl flex border border-gray-100">
                  {ROLES.map((role) => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => setSelectedRole(role.key)}
                      className={`flex-1 py-3.5 px-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${
                        selectedRole === role.key
                          ? "bg-white text-blue-600 shadow-sm border border-gray-100 scale-[1.02]"
                          : "text-gray-400 hover:text-gray-900"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                      <span className="uppercase tracking-widest">{role.label}</span>
                    </button>
                  ))}
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Legal Name</label>
                      <div className="relative group">
                        <input
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Johnathan Doe"
                          className="w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                        {selectedRole === "admin" ? "School Entity" : "Access Code"}
                      </label>
                      <div className="relative group">
                        <input
                          name={selectedRole === "admin" ? "schoolName" : "schoolCode"}
                          required
                          value={selectedRole === "admin" ? formData.schoolName : formData.schoolCode}
                          onChange={handleChange}
                          placeholder={selectedRole === "admin" ? "Academy Name" : "SCH-XXXX"}
                          className={`w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300 ${selectedRole !== "admin" ? "font-mono uppercase tracking-widest text-blue-600" : ""}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Work Email Address</label>
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Security Key</label>
                      <div className="relative group">
                        <input
                          name="password"
                          type="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder="••••••••"
                          className="w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Verify Key</label>
                      <div className="relative group">
                        <input
                          name="confirmPassword"
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder="••••••••"
                          className="w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
                        />
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
                    disabled={loading || success}
                    className={`w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50 ${success ? 'bg-green-500 shadow-[0_10px_20px_rgba(34,197,94,0.2)]' : ''}`}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : success ? (
                      <>
                        <span className="uppercase tracking-widest">Success!</span>
                        <span className="material-symbols-outlined">check_circle</span>
                      </>
                    ) : (
                      <>
                        <span className="uppercase tracking-widest">Register Profile</span>
                        <span className="material-symbols-outlined">person_add</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10 text-center">
                  <p className="text-gray-400 font-bold text-sm">
                    Already part of the family?{" "}
                    <Link href="/auth/login" className="text-blue-600 hover:underline decoration-2 underline-offset-8">
                      Sign In
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
