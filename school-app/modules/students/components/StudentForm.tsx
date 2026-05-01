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
    if (!form.admission_no.trim()) newErrors.admission_no = "Admission number is required";
    if (!form.first_name.trim()) newErrors.first_name = "First name is required";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!form.class_id.trim()) newErrors.class_id = "Class is required";
    if (!form.section.trim()) newErrors.section = "Section is required";
    if (!form.guardian.name.trim()) newErrors.guardian_name = "Guardian name is required";
    if (!form.guardian.phone.trim()) newErrors.guardian_phone = "Guardian phone is required";
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
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Academic Placement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Admission Number"
            placeholder="e.g., ADM-2024-001"
            value={form.admission_no}
            onChange={(e) => setForm({ ...form, admission_no: e.target.value })}
            error={errors.admission_no}
            required
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

      <div className="space-y-6 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Personal Details</h3>
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

      <div className="space-y-6 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Guardian Details</h3>
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
          label="Email Address"
          placeholder="Contact email address"
          type="email"
          value={form.guardian.email || ""}
          onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
        />
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
