/**
 * Signup form.
 *
 * Admins set up an entire institution profile here.
 */

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "shared/ui/AppIcon";

type Role = "admin" | "teacher" | "student";

const INSTITUTION_LEVELS = [
  "Primary",
  "Middle",
  "Secondary / High",
  "Higher Secondary",
  "K-12 (Combined)",
  "College",
  "University",
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
  const [step, setStep] = useState(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const selectedRole: Role = "admin";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    schoolName: "",
    schoolCode: "",
    principalName: "",
    establishmentYear: "",
    institutionLevel: "",
    institutionType: "Private",
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

  // Automatically focus the first input of the current step when step changes
  useEffect(() => {
    const firstInput = document.querySelector('form input[autoFocus], form select[autoFocus]') as HTMLElement;
    if (firstInput) {
      firstInput.focus();
    } else {
      const fallback = document.querySelector('form input, form select') as HTMLElement;
      if (fallback) fallback.focus();
    }
  }, [step]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) return "Full name is required";
      if (!formData.phone.trim()) return "Phone number is required";
      if (!formData.email.trim()) return "Email is required";
      if (!formData.password) return "Password is required";
      if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    }
    if (currentStep === 2) {
      if (!formData.schoolName.trim()) return "School Name is required";
    }
    if (currentStep === 3) {
      if (!acceptTerms) return "You must accept the Terms & Conditions and Privacy Policy to continue";
    }
    return null;
  }

  const nextStep = () => {
    const v = validateStep(step);
    if (v) { setError(v); return; }
    setStep(s => s + 1);
    setError("");
  };

  const prevStep = () => {
    setStep(s => s - 1);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") {
        e.preventDefault();
        
        // Find all visible/enabled input and select fields inside the form
        const form = target.closest("form");
        if (!form) return;
        
        const focusables = Array.from(
          form.querySelectorAll("input:not([disabled]), select:not([disabled])")
        ) as HTMLElement[];
        
        const index = focusables.indexOf(target);
        if (index > -1 && index < focusables.length - 1) {
          // Focus the next input
          focusables[index + 1].focus();
        } else {
          // Last input of current step: go to next step or submit
          if (step < 3) {
            nextStep();
          } else {
            handleSubmit(e as unknown as FormEvent);
          }
        }
      }
    }
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validateStep(3);
    if (v) { setError(v); return; }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: selectedRole }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error?.message || "Signup failed.");

      navigate("/auth/login");
    } catch (err: unknown) {
      setError((err as Error).message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Aesthetic Background */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/school-bg.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-[550px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-2xl rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/40 p-8 md:p-12 overflow-hidden"
        >
          <div className="text-center mb-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-white/50">
              <img src="/logo.jpeg" alt="Eduplexo" className="h-full w-full object-cover" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Create Account</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">Step {step} of 3</p>
            
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? "w-12 bg-blue-600" : "w-3 bg-gray-200"}`} />
              ))}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Field label="Full Legal Name" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="John Doe" autoFocus />
                  <Field label="Phone Number" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="+92 ..." />
                  <Field label="Work Email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@eduplexo.com" />
                  <div className="grid grid-cols-2 gap-4">
                    <PasswordField label="Password" name="password" value={formData.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    <PasswordField label="Verify" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Field label="School Name" name="schoolName" required value={formData.schoolName} onChange={handleChange} placeholder="Eduplexo Academy" autoFocus />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Principal (Optional)" name="principalName" value={formData.principalName} onChange={handleChange} placeholder="Dr. Aisha" />
                    <Field label="Est. Year (Optional)" name="establishmentYear" type="number" value={formData.establishmentYear} onChange={handleChange} placeholder="2024" />
                  </div>
                  <SelectField label="Institutional Level (Optional)" name="institutionLevel" value={formData.institutionLevel} onChange={handleChange} options={INSTITUTION_LEVELS as unknown as string[]} placeholder="Select level" />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Field label="Official Address (Optional)" name="addressLine" value={formData.addressLine} onChange={handleChange} placeholder="Street, building..." autoFocus />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City (Optional)" name="city" value={formData.city} onChange={handleChange} placeholder="Karachi" />
                    <Field label="Postal Code (Optional)" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="74000" />
                  </div>
                  <SelectField label="Country (Optional)" name="country" value={formData.country} onChange={handleChange} options={COUNTRIES as unknown as string[]} />
                  
                  <div className="flex items-start gap-3 mt-4 ml-2">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      required
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        setError("");
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer mt-0.5"
                    />
                    <label htmlFor="acceptTerms" className="text-xs text-gray-500 font-bold select-none cursor-pointer">
                      I accept the{" "}
                      <a
                        href="https://eduplexo.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline"
                      >
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://eduplexo.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      .
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="text-[11px] text-red-500 font-bold bg-red-50/80 p-4 rounded-2xl border border-red-100 flex items-center gap-2 shadow-sm"><AppIcon name="AlertCircle" size={16}  className="flex-shrink-0" />{error}</p>}

            <div className="flex gap-4 pt-4">
              {step > 1 && <button type="button" onClick={prevStep} className="flex-1 h-12 bg-white/50 hover:bg-white/80 text-gray-600 font-bold rounded-2xl transition-all border border-white/40">Back</button>}
              {step < 3 ? (
                <button type="button" onClick={nextStep} className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">Next Step <AppIcon name="ArrowRight" size={20} /></button>
              ) : (
                <button type="submit" disabled={loading || !acceptTerms} className="flex-[2] h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? "Processing..." : "Complete Setup"} {!loading && <AppIcon name="CheckCircle" size={20} />}</button>
              )}
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
              Already registered? <Link to="/auth/login" className="text-blue-600 hover:underline underline-offset-4 decoration-2">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder, required, autoFocus }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-2">{label}</label>
      <input name={name} type={type} required={required} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} className="w-full h-12 px-6 bg-white/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300" />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required, placeholder }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-2">{label}</label>
      <select name={name} required={required} value={value} onChange={onChange} className="w-full h-12 px-5 bg-white/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold appearance-none cursor-pointer">
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PasswordField({ label, name, value, onChange, show, onToggle }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 tracking-wide ml-2">{label}</label>
      <div className="relative">
        <input name={name} type={show ? "text" : "password"} required value={value} onChange={onChange} placeholder="••••••••" className="w-full h-12 pl-6 pr-14 bg-white/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 transition-all outline-none text-gray-900 font-bold placeholder:text-gray-300" />
        <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
          {show ? <AppIcon name="EyeOff" size={20} /> : <AppIcon name="Eye" size={20} />}
        </button>
      </div>
    </div>
  );
}
