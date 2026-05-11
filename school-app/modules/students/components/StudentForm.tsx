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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 normal-case ">Academic Placement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Admission Number"
            placeholder="Leave blank to auto-generate"
            value={form.admission_no || ""}
            onChange={(e) => setForm({ ...form, admission_no: e.target.value || undefined })}
            error={errors.admission_no}
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
            />
            <Input
              label="Section"
              placeholder="e.g., A"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              error={errors.section}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-bold text-slate-400 normal-case ">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            placeholder="Student's first name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            error={errors.first_name}
            required
          />

          <Input
            label="Last Name"
            placeholder="Student's last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            error={errors.last_name}
            required
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <h3 className="text-xs font-bold text-slate-400 normal-case ">Guardian Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Guardian Name"
            placeholder="Parent or guardian name"
            value={form.guardian.name}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, name: e.target.value } })}
            error={errors.guardian_name}
            required
          />

          <Input
            label="Phone Number"
            placeholder="Contact phone number"
            type="tel"
            value={form.guardian.phone}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, phone: e.target.value } })}
            error={errors.guardian_phone}
            required
          />
        </div>

        <Input
          label="Guardian Email"
          placeholder="Contact email address"
          type="email"
          value={form.guardian.email || ""}
          onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
        />
      </div>

      <div className="space-y-4 border-t border-blue-50 bg-blue-50/20 p-6 rounded-[2rem] mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-blue-900 normal-case ">Account Credentials</h3>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Student Portal Access</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
            <span className="material-symbols-outlined">lock_person</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <Input
            label="Student Email Address"
            placeholder="e.g., student@school.com"
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Temporary Password"
            placeholder="Minimum 8 characters"
            type="password"
            value={form.password || ""}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            required
          />
        </div>
        <p className="text-[10px] font-medium text-slate-400 italic">This email will be used for student login and academic notifications.</p>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={saving}
          className="w-full md:w-auto min-w-[150px]"
        >
          {saving ? "Enrolling..." : "Enroll Student"}
        </Button>
      </div>
    </form>
  );
}
