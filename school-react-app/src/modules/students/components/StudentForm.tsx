import { AppIcon } from "shared/ui/AppIcon";
import { FormEvent, useEffect, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { StudentFormInput, StudentRow } from "../types/student.types";

const initialForm: StudentFormInput = {
  admission_no: "",
  first_name: "",
  last_name: "",
  class_id: "",
  section: "",
  email: "",
  password: "",
  guardian: {
    name: "",
    phone: "",
    email: ""
  }
};

type ExistingParent = {
  _id: string;
  name: string;
  email: string;
  phone: string;
};

export type StudentFormMode = "create" | "edit";

interface StudentFormProps {
  onSubmit: (input: StudentFormInput) => Promise<unknown>;
  classOptions: Array<{ id: string; label: string; section?: string }>;
  /** Existing student data — when present, the form runs in edit mode. */
  initialValues?: StudentRow | null;
  mode?: StudentFormMode;
  onCancel?: () => void;
}

/** Backwards-compatible alias for legacy `onCreate` callers. */
interface LegacyStudentFormProps {
  onCreate: (input: StudentFormInput) => Promise<unknown>;
  classOptions: Array<{ id: string; label: string; section?: string }>;
}

function mapInitialValues(s: StudentRow): StudentFormInput {
  return {
    admission_no: s.admission_no ?? "",
    first_name: s.first_name ?? "",
    last_name: s.last_name ?? "",
    class_id: s.class_id ?? "",
    section: s.section ?? "",
    email: s.guardian?.email ?? "",
    password: "",
    guardian: {
      name: s.guardian?.name ?? "",
      phone: s.guardian?.phone ?? "",
      email: s.guardian?.email ?? "",
    },
  };
}

export function StudentForm(props: StudentFormProps | LegacyStudentFormProps) {
  // Support both new `onSubmit` and legacy `onCreate` prop name.
  const onSubmit =
    "onSubmit" in props ? props.onSubmit : (props as LegacyStudentFormProps).onCreate;
  const classOptions = props.classOptions;
  const initialValues =
    "initialValues" in props ? props.initialValues ?? null : null;
  const mode: StudentFormMode =
    "mode" in props && props.mode
      ? props.mode
      : initialValues
        ? "edit"
        : "create";
  const onCancel = "onCancel" in props ? props.onCancel : undefined;

  const [form, setForm] = useState<StudentFormInput>(() =>
    initialValues ? mapInitialValues(initialValues) : initialForm
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingParent, setExistingParent] = useState<ExistingParent | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Group class records by their label (unique names)
  const uniqueClassNames = Array.from(new Set(classOptions.map(o => o.label)));
  
  // Available sections based on selected class name
  const availableSections = classOptions
    .filter(o => o.label === selectedClassName)
    .map(o => o.section || "")
    .filter(Boolean);

  const handleClassChange = (className: string) => {
    setSelectedClassName(className);
    const matched = classOptions.filter(o => o.label === className);
    if (matched.length > 0) {
      setForm((prev: StudentFormInput) => ({
        ...prev,
        class_id: matched[0].id,
        section: matched[0].section || ""
      }));
    } else {
      setForm((prev: StudentFormInput) => ({
        ...prev,
        class_id: "",
        section: ""
      }));
    }
  };

  const handleSectionChange = (section: string) => {
    const matched = classOptions.find(o => o.label === selectedClassName && o.section === section);
    if (matched) {
      setForm((prev: StudentFormInput) => ({
        ...prev,
        class_id: matched.id,
        section: section
      }));
    }
  };

  // Sync selected class name when form is loaded with class_id
  useEffect(() => {
    if (form.class_id && classOptions.length > 0) {
      const matched = classOptions.find(o => o.id === form.class_id);
      if (matched) {
        setSelectedClassName(matched.label);
      }
    }
  }, [form.class_id, classOptions]);

  // Re-populate when initialValues arrives late (edit page finishes
  // loading the student record after first paint).
  useEffect(() => {
    if (initialValues) {
      setForm(mapInitialValues(initialValues));
    }
  }, [initialValues]);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.first_name?.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name?.trim()) newErrors.last_name = "Last name is required";
    if (!form.class_id?.trim()) newErrors.class_id = "Class is required";
    if (!form.section?.trim()) newErrors.section = "Section is required";
    if (!form.guardian.name?.trim()) newErrors.guardian_name = "Guardian name is required";
    if (!form.guardian.phone?.trim()) newErrors.guardian_phone = "Guardian phone is required";

    // Parent email + password are required only on create. In edit mode the
    // guardian/parent account already exists; password is optional and only
    // overwrites the current one when filled.
    if (mode === "create") {
      if (!form.email?.trim()) newErrors.email = "Parent email is required";
      // Password is not required when we're linking the new student to
      // an existing parent account — the parent already has credentials.
      if (!linkMode && (!form.password || form.password.length < 8)) {
        newErrors.password = "Password must be at least 8 characters";
      }
    } else {
      // Edit mode: validate password only if user typed something.
      if (form.password && form.password.length > 0 && form.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
    }

    if (existingParent && (existingParent as any).role_mismatch) {
      newErrors.email = "This email is already in use by another role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function checkParentEmail(email: string) {
    if (!email || !email.includes('@')) return;

    setCheckingEmail(true);
    try {
      // Route through serviceRequest so the bearer token + cookie are
      // attached. Plain `fetch` here lost the auth header and the
      // backend then rejected the call as UNAUTHENTICATED, which is
      // why the inline "link to existing parent" card never appeared.
      const result = await serviceRequest<{
        exists: boolean;
        parent?: ExistingParent & { children_count?: number; existing_role?: string; role_mismatch?: boolean };
      }>("/api/parents/check-email", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (result.ok && result.data?.exists && result.data.parent) {
        setExistingParent(result.data.parent);
      } else {
        setExistingParent(null);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to check parent email:", error);
      setExistingParent(null);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // Normalize admission_no: empty/whitespace → omit it entirely so the
      // backend triggers its auto-generate path. Don't send the empty string
      // (the backend's unique-index check then trips false-positive duplicate
      // errors for any school with an existing blank-admission row).
      const trimmedAdm = (form.admission_no || "").trim();
      const trimmedPwd = (form.password || "").trim();
      // When the admin chose to link to an existing parent we send the
      // parent's user id so the backend skips both the duplicate-email
      // check and the parent provisioning step. Password is also
      // omitted because the existing parent already has one.
      const linkParentUserID =
        linkMode && existingParent && (existingParent as any)._id
          ? String((existingParent as any)._id)
          : "";
      const payload: StudentFormInput & {
        link_parent_user_id?: string;
      } = {
        ...form,
        admission_no: trimmedAdm.length > 0 ? trimmedAdm : undefined,
        // In edit mode, omit password if blank so the backend doesn't
        // overwrite the existing parent's password hash. In create
        // mode with linkMode on, also omit so we don't reset the
        // linked parent's password.
        password:
          (mode === "edit" && trimmedPwd.length === 0) || linkParentUserID
            ? (undefined as unknown as string)
            : form.password,
        link_parent_user_id: linkParentUserID || undefined,
      };
      const result = (await onSubmit(payload)) as { ok?: boolean } | undefined;
      if (mode === "create" && result?.ok !== false) {
        setForm(initialForm);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Academic Placement */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <AppIcon name="GraduationCap" />
            </div>
            <div>
                <h3 className="text-[11px] font-black text-slate-900 normal-case tracking-tight">Academic Placement</h3>
                <p className="text-[9px] font-bold text-slate-400 normal-case ">Assign class and identification details</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/20">
          <Input
            label="Admission Number"
            placeholder="Leave blank to auto-generate"
            value={form.admission_no || ""}
            onChange={(e) => {
              const v = e.target.value;
              setForm({ ...form, admission_no: v.trim() === "" ? undefined : v });
            }}
            error={errors.admission_no}
            helperText="Leave blank — the system assigns a unique STU-XXXXX code automatically."
            className="h-11 rounded-xl bg-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Class"
              value={selectedClassName}
              onChange={(e) => handleClassChange(e.target.value)}
              options={[
                { label: "Select Class", value: "" },
                ...uniqueClassNames.map(name => ({ label: name, value: name }))
              ]}
              error={errors.class_id}
              required
              className="h-11 rounded-xl bg-white"
            />
            <Select
              label="Section"
              value={form.section}
              onChange={(e) => handleSectionChange(e.target.value)}
              options={[
                { label: "Select Section", value: "" },
                ...availableSections.map(sec => ({ label: sec, value: sec }))
              ]}
              error={errors.section}
              required
              disabled={!selectedClassName || availableSections.length === 0}
              className="h-11 rounded-xl bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Personal Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <AppIcon name="User" />
            </div>
            <div>
                <h3 className="text-[11px] font-black text-slate-900 normal-case tracking-tight">Personal Details</h3>
                <p className="text-[9px] font-bold text-slate-400 normal-case ">Student's identification and naming</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/20">
          <Input
            label="First Name"
            placeholder="Student's first name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            error={errors.first_name}
            required
            className="h-11 rounded-xl bg-white"
          />

          <Input
            label="Last Name"
            placeholder="Student's last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            error={errors.last_name}
            required
            className="h-11 rounded-xl bg-white"
          />
        </div>
      </div>

      {/* Section 3: Guardian Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <AppIcon name="Users" />
            </div>
            <div>
                <h3 className="text-[11px] font-black text-slate-900 normal-case tracking-tight">Guardian Details</h3>
                <p className="text-[9px] font-bold text-slate-400 normal-case ">Parent or legal guardian information</p>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/20">
          <Input
            label="Guardian Name"
            placeholder="Parent or guardian name"
            value={form.guardian.name}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, name: e.target.value } })}
            error={errors.guardian_name}
            required
            disabled={linkMode && !!existingParent}
            className="h-11 rounded-xl bg-white"
          />

          <Input
            label="Phone Number"
            placeholder="Contact phone number"
            type="tel"
            value={form.guardian.phone}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, phone: e.target.value } })}
            error={errors.guardian_phone}
            required
            disabled={linkMode && !!existingParent}
            className="h-11 rounded-xl bg-white"
          />

        </div>
      </div>

      {/* Section 4: Account Credentials */}
      <div className="space-y-4 border-t border-indigo-100 bg-indigo-50/30 p-6 rounded-[2.5rem] mt-4 shadow-inner shadow-indigo-100/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <AppIcon name="UserCheck" size={24} />
            </div>
            <div>
                <h3 className="text-sm font-black text-indigo-900 normal-case tracking-tight">Account Credentials</h3>
                <p className="text-[10px] font-bold text-indigo-400 normal-case  tracking-wide">Parent Portal Access Configuration</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Parent Email Address"
            placeholder="Email used for Parent Portal login"
            type="email"
            value={form.email || ""}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (existingParent) {
                setExistingParent(null);
                setLinkMode(false);
              }
            }}
            onBlur={(e) => checkParentEmail(e.target.value)}
            error={errors.email}
            required
            className="h-11 rounded-xl bg-white border-indigo-100 focus:border-indigo-400"
          />

          {mode === "edit" && !isChangingPassword ? (
            <div className="flex items-end gap-3 w-full">
              <Input
                label="Login Password"
                type="password"
                value="••••••••"
                disabled
                className="h-11 rounded-xl bg-slate-50 border-indigo-100 text-slate-400"
              />
              <button
                type="button"
                onClick={() => setIsChangingPassword(true)}
                className="h-11 px-4 rounded-xl border border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-50 font-bold text-xs transition-all tracking-wide normal-case active:scale-95 shrink-0"
              >
                Change Password
              </button>
            </div>
          ) : (
            <Input
              label={
                mode === "edit"
                  ? "New Password"
                  : linkMode
                    ? "Password (managed by linked parent)"
                    : "Temporary Password"
              }
              placeholder={
                mode === "edit"
                  ? "Enter new password"
                  : linkMode
                    ? "Linked — password not needed"
                    : "Minimum 8 characters"
              }
              type={showPassword ? "text" : "password"}
              value={linkMode ? "" : form.password || ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              required={mode === "create" && !linkMode}
              disabled={linkMode}
              className="h-11 rounded-xl bg-white border-indigo-100 focus:border-indigo-400"
              rightIcon={
                !linkMode ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <AppIcon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                  </button>
                ) : undefined
              }
            />
          )}

          <div className="md:col-span-2">
            {checkingEmail && (
              <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 px-1">
                <AppIcon name="Loader2" size={14} className="animate-spin" />
                Checking school records for existing parent account...
              </p>
            )}
            {existingParent && !linkMode && (
              <div className={`mt-4 p-5 rounded-[1.5rem] border shadow-sm animate-fade-in ${
                (existingParent as any).role_mismatch ? 'bg-rose-50 border-rose-100' : 'bg-blue-50 border-blue-100'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md ${
                    (existingParent as any).role_mismatch ? 'bg-rose-600 shadow-rose-200' : 'bg-blue-600 shadow-blue-200'
                  }`}>
                    <AppIcon name={(existingParent as any).role_mismatch ? 'warning' : 'person_check'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-[12px] font-black tracking-tight ${
                        (existingParent as any).role_mismatch ? 'text-rose-900' : 'text-blue-900'
                      }`}>
                        {(existingParent as any).role_mismatch ? 'Role Conflict Detected' : 'Existing Parent Found'}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                        (existingParent as any).role_mismatch ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {(existingParent as any).existing_role || 'Verified'}
                      </span>
                    </div>
                    
                    {(existingParent as any).role_mismatch ? (
                      <p className="text-[10px] font-medium text-rose-700/80 leading-relaxed mb-4">
                        This email is already registered as <strong>{(existingParent as any).existing_role}</strong>. 
                        A single email cannot be reused for different roles. 
                        Please use a dedicated email for the parent account.
                      </p>
                    ) : (
                      <>
                        <p className="text-[10px] font-medium text-blue-700/80 leading-relaxed mb-4">
                          This email belongs to <strong>{existingParent.name}</strong> who is already registered in this school with <strong>{(existingParent as any).children_count || 0} student(s)</strong>.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setLinkMode(true);
                              setForm({
                                ...form,
                                guardian: {
                                  name: existingParent.name,
                                  phone: existingParent.phone,
                                  email: existingParent.email
                                }
                              });
                              setForm((prev: any) => ({ ...prev, email: existingParent.email }));
                            }}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                          >
                            <AppIcon name="Link" size={14} />
                            Link Student to this Parent
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setExistingParent(null);
                              setForm({ ...form, email: "" });
                            }}
                            className="px-5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black transition-all active:scale-95"
                          >
                            Use Different Email
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {linkMode && existingParent && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 animate-fade-in shadow-sm">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <AppIcon name="CheckCircle" size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-900 leading-none">Smart Link Active</p>
                  <p className="text-[9px] font-bold text-emerald-600 mt-0.5">Linked to: {existingParent.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLinkMode(false);
                    setExistingParent(null);
                    setForm({ ...form, email: "" });
                  }}
                  className="ml-auto h-7 w-7 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-emerald-400 transition-colors"
                >
                  <AppIcon name="X" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
            <AppIcon name="Info" size={14} className="text-indigo-400" />
            <p className="text-[10px] font-medium text-indigo-400 italic">This email will be used for Parent Portal login and child updates.</p>
        </div>
      </div>

      {/* Section 5: Financial Aid / Scholarship */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                <AppIcon name="Award" />
            </div>
            <div>
                <h3 className="text-[11px] font-black text-slate-900 normal-case tracking-tight">Financial Aid</h3>
                <p className="text-[9px] font-bold text-slate-400 normal-case">Scholarship or fee concession settings</p>
            </div>
        </div>
        <div className="p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Enable Scholarship</p>
              <p className="text-[10px] text-slate-400">Toggle on to apply financial aid to this student's fees</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={(form as any).scholarship_enabled || false}
                onChange={(e) => setForm({ ...form, scholarship_enabled: e.target.checked } as any)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {(form as any).scholarship_enabled && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Scholarship Type"
                  value={(form as any).scholarship_type || "percentage"}
                  onChange={(e) => setForm({ ...form, scholarship_type: e.target.value } as any)}
                  options={[
                    { label: "Percentage (%)", value: "percentage" },
                    { label: "Fixed Amount (Rs)", value: "fixed" },
                  ]}
                  className="h-11 rounded-xl bg-white"
                />
                <Input
                  label={(form as any).scholarship_type === "fixed" ? "Amount (Rs)" : "Percentage (%)"}
                  type="number"
                  placeholder={(form as any).scholarship_type === "fixed" ? "e.g. 2000" : "e.g. 50"}
                  value={(form as any).scholarship_value || ""}
                  onChange={(e) => setForm({ ...form, scholarship_value: e.target.value } as any)}
                  className="h-11 rounded-xl bg-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Academic Year"
                  type="number"
                  placeholder="e.g. 2024"
                  value={(form as any).scholarship_year || ""}
                  onChange={(e) => setForm({ ...form, scholarship_year: e.target.value } as any)}
                  className="h-11 rounded-xl bg-white"
                  min="2000"
                  max="2100"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-2">Apply On:</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: "scholarship_apply_monthly", label: "Monthly Fee" },
                    { key: "scholarship_apply_fine", label: "Fine" },
                    { key: "scholarship_apply_onetime", label: "One-Time Charges" },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form as any)[opt.key] ?? (opt.key === "scholarship_apply_monthly")}
                        onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked } as any)}
                        className="rounded border-slate-300 text-blue-600 h-4 w-4"
                      />
                      <span className="text-xs font-medium text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Input
                label="Notes (optional)"
                placeholder="e.g. Merit scholarship, sibling discount..."
                value={(form as any).scholarship_notes || ""}
                onChange={(e) => setForm({ ...form, scholarship_notes: e.target.value } as any)}
                className="h-11 rounded-xl bg-white"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100 gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => (onCancel ? onCancel() : window.history.back())}
          className="h-10 px-8 rounded-xl text-[10px] font-bold normal-case "
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || (existingParent && (existingParent as any).role_mismatch) || false}
          className="h-10 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-bold normal-case  transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? mode === "edit"
              ? "Updating..."
              : "Enrolling..."
            : mode === "edit"
              ? "Update Student"
              : "Enroll Student"}
        </Button>
      </div>
    </form>
  );
}
