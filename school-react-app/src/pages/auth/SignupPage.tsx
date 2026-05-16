/**
 * Signup form.
 *
 * Admins set up an entire institution profile here so the rest of the
 * platform has the data it needs to render official documents (fee
 * receipts, transfer certificates, marksheets, etc.). Teachers and
 * students keep the lighter access-code flow.
 *
 * Frontend-only fields shipped on the request body — the Go signup
 * handler ignores any keys it doesn't recognise, so the existing
 * backend keeps working unchanged. When the backend later starts
 * persisting these fields, no UI changes are needed.
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

const INSTITUTION_LEVELS = [
  "Primary",
  "Middle",
  "Secondary / High",
  "Higher Secondary",
  "K-12 (Combined)",
  "College",
  "University",
] as const;

const INSTITUTION_TYPES = [
  "Public",
  "Private",
  "Charter",
  "International",
  "Religious",
  "Other",
] as const;

const COUNTRIES = [
  "Pakistan",
  "India",
  "Bangladesh",
  "Sri Lanka",
  "United Arab Emirates",
  "Saudi Arabia",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Other",
] as const;

const currentYear = new Date().getFullYear();

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");

  const [formData, setFormData] = useState({
    // Account
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Admin-only — institution profile
    schoolName: "",
    schoolCode: "",
    principalName: "",
    establishmentYear: "",
    institutionLevel: "",
    institutionType: "",
    affiliationBoard: "",
    registrationNumber: "",
    addressLine: "",
    city: "",
    state: "",
    country: "Pakistan",
    postalCode: "",
    websiteUrl: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // InteractiveCharacters animation states (kept verbatim from original).
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  function set<K extends keyof typeof formData>(key: K, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError("");
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 200);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    set(e.target.name as keyof typeof formData, e.target.value);
  }

  function validate(): string | null {
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }
    if (selectedRole === "admin") {
      if (!formData.schoolName.trim()) return "School name is required";
      if (!formData.principalName.trim()) return "Principal name is required";
      if (!formData.establishmentYear.trim()) return "Establishment year is required";
      const yr = Number(formData.establishmentYear);
      if (!yr || yr < 1800 || yr > currentYear) {
        return "Enter a valid establishment year";
      }
      if (!formData.institutionLevel) return "Pick an institutional level";
      if (!formData.addressLine.trim()) return "Official address is required";
      if (!formData.city.trim()) return "City is required";
      if (!formData.country.trim()) return "Country is required";
      if (!formData.phone.trim() || formData.phone.replace(/\D/g, "").length < 7) {
        return "Enter a valid phone number";
      }
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Build the payload conditionally — non-admin signups don't need
      // the institution block. Backend ignores unknown fields, but we
      // keep the wire small either way.
      const base = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        role: selectedRole,
      } as Record<string, string>;
      const adminExtras: Record<string, string> =
        selectedRole === "admin"
          ? {
              schoolName: formData.schoolName,
              principalName: formData.principalName,
              establishmentYear: formData.establishmentYear,
              institutionLevel: formData.institutionLevel,
              institutionType: formData.institutionType,
              affiliationBoard: formData.affiliationBoard,
              registrationNumber: formData.registrationNumber,
              addressLine: formData.addressLine,
              city: formData.city,
              state: formData.state,
              country: formData.country,
              postalCode: formData.postalCode,
              websiteUrl: formData.websiteUrl,
            }
          : { schoolCode: formData.schoolCode };
      const payload = { ...base, ...adminExtras };

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const friendly =
          response.status === 409
            ? result?.error?.message ||
              "An account with these details already exists. Please sign in instead."
            : response.status === 400
              ? result?.error?.message ||
                "Some of the information you entered isn't valid. Please review and try again."
              : response.status >= 500
                ? "We can't reach the sign-up service right now. Please try again shortly."
                : result?.error?.message ||
                  "We couldn't create your account. Please check your details and try again.";
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
  }

  const isAdmin = selectedRole === "admin";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden py-12">
      <div className="w-full max-w-[760px] relative">
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
              <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                Create Account
              </h2>
              <p className="text-gray-400 font-semibold normal-case tracking-[0.15em] text-xs">
                Join the Eduplexo network
              </p>
            </div>

            <div className="mb-8 p-1.5 bg-gray-50 rounded-2xl flex border border-gray-100">
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
              {/* ── Account ─────────────────────────────────────────────── */}
              <Section title="Account" subtitle="Identity for your portal sign-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field
                    label="Full Legal Name"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Johnathan Doe"
                  />
                  {!isAdmin && (
                    <Field
                      label="Access Code"
                      name="schoolCode"
                      required
                      value={formData.schoolCode}
                      onChange={handleChange}
                      placeholder="SCH-XXXX"
                      mono
                    />
                  )}
                  {isAdmin && (
                    <Field
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 normal-case ml-2">
                    Work Email Address
                  </label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PasswordField
                    label="Security Key"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <PasswordField
                    label="Verify Key"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    show={showConfirmPassword}
                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                </div>
              </Section>

              {/* ── Institution profile (admin only) ─────────────────────── */}
              {isAdmin && (
                <>
                  <Section
                    title="Institution Profile"
                    subtitle="Used on official documents — receipts, certificates, marksheets"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field
                        label="School / Institution Name"
                        name="schoolName"
                        required
                        value={formData.schoolName}
                        onChange={handleChange}
                        placeholder="Eduplexo Academy"
                      />
                      <Field
                        label="Principal Name"
                        name="principalName"
                        required
                        value={formData.principalName}
                        onChange={handleChange}
                        placeholder="Dr. Aisha Khan"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Field
                        label="Establishment Year"
                        name="establishmentYear"
                        type="number"
                        required
                        value={formData.establishmentYear}
                        onChange={handleChange}
                        placeholder={String(currentYear - 10)}
                        inputProps={{ min: 1800, max: currentYear }}
                      />
                      <SelectField
                        label="Institutional Level"
                        name="institutionLevel"
                        required
                        value={formData.institutionLevel}
                        onChange={handleChange}
                        options={INSTITUTION_LEVELS as unknown as string[]}
                        placeholder="Select level"
                      />
                      <SelectField
                        label="Institution Type"
                        name="institutionType"
                        value={formData.institutionType}
                        onChange={handleChange}
                        options={INSTITUTION_TYPES as unknown as string[]}
                        placeholder="Select type"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Field
                        label="Affiliation / Board"
                        name="affiliationBoard"
                        value={formData.affiliationBoard}
                        onChange={handleChange}
                        placeholder="e.g. Federal Board, CBSE, IB"
                      />
                      <Field
                        label="Registration Number"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="Optional — official reg. no."
                      />
                    </div>
                  </Section>

                  <Section title="Official Address" subtitle="Where your campus is located">
                    <Field
                      label="Address Line"
                      name="addressLine"
                      required
                      value={formData.addressLine}
                      onChange={handleChange}
                      placeholder="Street, building, landmark"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Field
                        label="City"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Karachi"
                      />
                      <Field
                        label="State / Province"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Sindh"
                      />
                      <Field
                        label="Postal Code"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="74000"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <SelectField
                        label="Country"
                        name="country"
                        required
                        value={formData.country}
                        onChange={handleChange}
                        options={COUNTRIES as unknown as string[]}
                        placeholder="Select country"
                      />
                      <Field
                        label="Website (optional)"
                        name="websiteUrl"
                        type="url"
                        value={formData.websiteUrl}
                        onChange={handleChange}
                        placeholder="https://your-school.edu"
                      />
                    </div>
                  </Section>
                </>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                >
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
                <Link
                  to="/auth/login"
                  className="text-blue-600 hover:underline decoration-2 underline-offset-8"
                >
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

/* ─── Local form primitives ───────────────────────────────────────────── */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="h-8 w-1 rounded-full bg-blue-600" />
        <div>
          <h3 className="text-[13px] font-bold text-gray-900 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
  inputProps?: Record<string, unknown>;
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  mono,
  inputProps,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-400 normal-case ml-2">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...(inputProps || {})}
        className={`w-full h-12 px-6 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300 ${
          mono ? "font-mono normal-case text-blue-600" : ""
        }`}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-400 normal-case ml-2">{label}</label>
      <select
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full h-12 px-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold appearance-none cursor-pointer"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

function PasswordField({
  label,
  name,
  value,
  onChange,
  show,
  onToggle,
  onFocus,
  onBlur,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-400 normal-case ml-2">{label}</label>
      <div className="relative group">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="••••••••"
          className="w-full h-12 pl-6 pr-14 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          <span className="material-symbols-outlined text-[20px]">
            {show ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
    </div>
  );
}
