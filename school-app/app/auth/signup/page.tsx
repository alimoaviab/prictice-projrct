"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "admin" | "teacher" | "student" | "parent";

export default function SignupPage() {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
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

  return (
    <div className="bg-gradient-to-br from-surface to-surface-container min-h-screen flex items-center justify-center p-sm lg:p-xl font-body-md text-on-surface">
      <div className="max-w-[1200px] w-full bg-surface-container-lowest rounded-[24px] shadow-soft-ambient flex flex-col lg:flex-row relative z-10 border border-outline-variant/30 overflow-visible">
        {/* Left Side: Image and Branding */}
        <div
          className="lg:w-5/12 relative hidden lg:flex flex-col justify-end p-xl overflow-hidden min-h-[600px] rounded-r-[80px]"
          style={{ clipPath: "ellipse(100% 120% at 0% 50%)" }}
        >
          <div className="absolute inset-0 bg-primary/20 z-10 mix-blend-multiply rounded-r-[80px]"></div>
          <img
            alt="Modern educational campus"
            className="absolute inset-0 w-full h-full object-cover rounded-r-[80px]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAdyCVNz6vSHSwd-rbVf0kNpJo4k3G6lwGMOU2f17VDvcWZJtLKw3ZHGTyOnokhzFqY9DdOCxtNtEmxGvLTdugN_G-shZ8ZwbBeNn2oBPuMOh59-lZtOpcHr908UPYxXmys7LpMhBEoOUQUJpjnFwOCn5Y_LvWWPD_pmFMlfbONWwZ5mwwMEIjAEHY8l-kjhiKhmMcPtuBXIlsVmtARyw5rnDPangYmHCvt8dY4OuZJefzAP2yXpmmLpeW1Cx_EKBSR3VJrwRKNTk"
          />
          <div className="relative z-20 text-on-primary">
            <div className="flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-[32px] text-primary-fixed">
                school
              </span>
              <span className="font-headline-md text-primary-fixed">
                EduFlow
              </span>
            </div>
            <h1 className="font-headline-lg text-white mb-sm drop-shadow-md">
              Start Your Educational Journey
            </h1>
            <p className="font-body-lg text-primary-container drop-shadow-sm max-w-md text-primary-fixed-dim">
              Join thousands of schools managing their operations with clarity,
              reliability, and modern sophistication.
            </p>
          </div>
          {/* Subtle gradient overlay at bottom for text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-on-background/80 to-transparent z-10 rounded-br-[80px]"></div>
        </div>

        {/* Right Side: Signup Form Container */}
        <div className="lg:w-7/12 p-sm sm:p-lg xl:p-xl flex items-center justify-center bg-surface-container-lowest">
          <div className="w-full max-w-[480px]">
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center justify-center gap-sm mb-lg">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[20px]">
                  school
                </span>
              </div>
              <h1 className="font-headline-md text-primary">EduFlow</h1>
            </div>

            <div className="mb-lg">
              <h2 className="font-headline-md text-on-surface mb-xs">
                Create Account
              </h2>
              <p className="font-body-md text-on-surface-variant">
                Fill in the details below to get started
              </p>
            </div>

            {/* Role Selector (Segmented Control) */}
            <div className="mb-lg">
              <label className="block font-label-md text-on-surface-variant mb-sm">
                Register as
              </label>
              <div className="grid grid-cols-4 gap-xs bg-surface-container rounded-lg p-xs border border-outline-variant/20">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`py-sm px-xs font-label-sm rounded-DEFAULT transition-colors flex flex-col items-center gap-xs ${
                      selectedRole === role.key
                        ? "text-on-primary bg-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-variant/50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {role.icon}
                    </span>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form className="space-y-md" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label htmlFor="fullName" className="block font-label-md text-on-surface mb-xs">
                    Full Name
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-sm top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]"
                    >
                      person
                    </span>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md text-on-surface px-sm py-sm pl-lg transition-colors rounded-t-DEFAULT"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="schoolName" className="block font-label-md text-on-surface mb-xs">
                    School Name
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-sm top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]"
                    >
                      apartment
                    </span>
                    <input
                      id="schoolName"
                      name="schoolName"
                      type="text"
                      value={formData.schoolName}
                      onChange={handleChange}
                      required
                      placeholder="Greenwood Academy"
                      className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md text-on-surface px-sm py-sm pl-lg transition-colors rounded-t-DEFAULT"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block font-label-md text-on-surface mb-xs">
                  Email Address
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-sm top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]"
                  >
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md text-on-surface px-sm py-sm pl-lg transition-colors rounded-t-DEFAULT"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div>
                  <label htmlFor="password" className="block font-label-md text-on-surface mb-xs">
                    Password
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-sm top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]"
                    >
                      lock
                    </span>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md text-on-surface px-sm py-sm pl-lg transition-colors rounded-t-DEFAULT"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block font-label-md text-on-surface mb-xs">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute left-sm top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px]"
                    >
                      lock_reset
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-surface-container-low border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-body-md text-on-surface px-sm py-sm pl-lg transition-colors rounded-t-DEFAULT"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-error font-label-md text-sm">{error}</div>
              )}

              <div className="pt-sm">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary font-label-md py-sm px-md rounded-full shadow-card hover:shadow-soft-ambient hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-card"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-sm my-lg">
              <div className="flex-1 h-px bg-outline-variant/30"></div>
              <span className="font-label-sm text-on-surface-variant uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-outline-variant/30"></div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-md">
              <button
                type="button"
                className="flex items-center justify-center gap-sm py-sm px-md bg-surface border border-outline-variant/30 rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
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
                className="flex items-center justify-center gap-sm py-sm px-md bg-surface border border-outline-variant/30 rounded-lg font-label-md text-on-surface hover:bg-surface-container-low transition-colors shadow-sm"
              >
                <img
                  alt="Microsoft"
                  className="w-5 h-5"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuANZI9cNyZV1UhmF5iHFvFoXcmV2rWQhsEe97Pm92Hs_XbZvj9Gw_6XLaksYhOmaReBnvrlLVx_qvy6H0f-cVNEF1gcRLucB9OKeBbNxhTKADG1ze3Y1GY0io8AbiAXyNGoARWd34gS72FBvmc0U57W4npYR6LjTxT8ew_fTni0_N5QWL5cP0_TBx-THcACYdsPJ7PVw0doyem3E0Ey-Sfxv1JEc--UMJWmq-eT9PS--KsGKHFbno3dZrFn_iG2EMjtlZBJc2MQdds"
                />
                Microsoft
              </button>
            </div>

            <p className="mt-lg text-center font-body-md text-sm text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-label-md"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
