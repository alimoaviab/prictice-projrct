"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
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

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.first_name?.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name?.trim()) newErrors.last_name = "Last name is required";
    if (!form.class_id?.trim()) newErrors.class_id = "Class is required";
    if (!form.section?.trim()) newErrors.section = "Section is required";
    if (!form.guardian.name?.trim()) newErrors.guardian_name = "Guardian name is required";
    if (!form.guardian.phone?.trim()) newErrors.guardian_phone = "Guardian phone is required";
    if (!form.email?.trim()) newErrors.email = "Student email is required";
    if (!form.password || form.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
            className="h-11 rounded-xl bg-white"
          />

          <div className="md:col-span-2">
            <Input
              label="Guardian Email"
              placeholder="Contact email address"
              type="email"
              value={form.guardian.email || ""}
              onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
              className="h-11 rounded-xl bg-white"
            />
          </div>
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
                <p className="text-[10px] font-bold text-indigo-400 normal-case  tracking-wide">Student Portal Access Configuration</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Student Email Address"
            placeholder="e.g., student@school.com"
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
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
        </div>
        <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-[14px] text-indigo-400">info</span>
            <p className="text-[10px] font-medium text-indigo-400 italic">This email will be used for student login and academic notifications.</p>
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
          disabled={saving}
          className="h-10 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-[10px] font-bold normal-case  transition-all active:scale-95"
        >
          {saving ? "Enrolling..." : "Enroll Student"}
        </Button>
      </div>
    </form>
  );
}
