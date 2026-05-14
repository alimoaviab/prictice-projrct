import { FormEvent, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { StudentFormInput } from "../types/student.types";

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

export function StudentForm({
  onCreate,
  classOptions
}: {
  onCreate: (input: StudentFormInput) => Promise<unknown>;
  classOptions: Array<{ id: string; label: string }>;
}) {
  const [form, setForm] = useState<StudentFormInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingParent, setExistingParent] = useState<ExistingParent | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [linkMode, setLinkMode] = useState(false);

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.first_name?.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name?.trim()) newErrors.last_name = "Last name is required";
    if (!form.class_id?.trim()) newErrors.class_id = "Class is required";
    if (!form.section?.trim()) newErrors.section = "Section is required";
    if (!form.guardian.name?.trim()) newErrors.guardian_name = "Guardian name is required";
    if (!form.guardian.phone?.trim()) newErrors.guardian_phone = "Guardian phone is required";
    if (!form.email?.trim()) newErrors.email = "Parent email is required";
    if (!form.password || form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    
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
      const response = await fetch('/api/parents/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      if (result.ok && result.data?.exists) {
        setExistingParent(result.data.parent);
      } else {
        setExistingParent(null);
      }
    } catch (error) {
      console.error('Failed to check parent email:', error);
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
      const result = (await onCreate(form)) as { ok?: boolean } | undefined;
      if (result?.ok !== false) {
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
                <span className="material-symbols-outlined text-[20px]">school</span>
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
            onChange={(e) => setForm({ ...form, admission_no: e.target.value || undefined })}
            error={errors.admission_no}
            className="h-11 rounded-xl bg-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Class"
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              options={[
                { label: "Select class", value: "" },
                ...classOptions.map(o => ({ label: o.label, value: o.id }))
              ]}
              error={errors.class_id}
              required
              className="h-11 rounded-xl bg-white"
            />
            <Input
              label="Section"
              placeholder="e.g., A"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              error={errors.section}
              required
              className="h-11 rounded-xl bg-white"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Personal Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <span className="material-symbols-outlined text-[20px]">person</span>
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
                <span className="material-symbols-outlined text-[20px]">family_restroom</span>
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
                <span className="material-symbols-outlined text-[24px]">lock_person</span>
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

          <Input
            label="Temporary Password"
            placeholder="Minimum 8 characters"
            type="password"
            value={form.password || ""}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
            className="h-11 rounded-xl bg-white border-indigo-100 focus:border-indigo-400"
          />

          <div className="md:col-span-2">
            {checkingEmail && (
              <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 px-1">
                <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
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
                    <span className="material-symbols-outlined text-[20px]">
                      {(existingParent as any).role_mismatch ? 'warning' : 'person_check'}
                    </span>
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
                            <span className="material-symbols-outlined text-[14px]">link</span>
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
                  <span className="material-symbols-outlined text-[18px]">verified</span>
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
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-[14px] text-indigo-400">info</span>
            <p className="text-[10px] font-medium text-indigo-400 italic">This email will be used for Parent Portal login and child updates.</p>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100 gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => window.history.back()}
          className="h-10 px-8 rounded-xl text-[10px] font-bold normal-case "
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || (existingParent && (existingParent as any).role_mismatch)}
          className="h-10 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-[10px] font-bold normal-case  transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enrolling..." : "Enroll Student"}
        </Button>
      </div>
    </form>
  );
}
