"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { colors, spacing, typography } from "@edu/shared/design-system/tokens";
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
      <FormSection title="Student Information" description="Add basic details about the student" columns={2}>
        <FormGroup label="Admission Number" required error={errors.admission_no}>
          <Input
            placeholder="e.g., ADM-2024-001"
            value={form.admission_no}
            onChange={(e) => setForm({ ...form, admission_no: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Class" required error={errors.class_id}>
          <select
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            style={{
              padding: spacing.sm,
              borderRadius: 4,
              border: `1px solid ${colors.outline}`,
              minHeight: 42
            }}
          >
            <option value="">Select class</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="First Name" required error={errors.first_name}>
          <Input
            placeholder="Student's first name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Last Name" required error={errors.last_name}>
          <Input
            placeholder="Student's last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </FormGroup>

        <FormGroup label="Section" required error={errors.section}>
          <Input
            placeholder="e.g., A, B, C"
            value={form.section}
            onChange={(e) => setForm({ ...form, section: e.target.value })}
          />
        </FormGroup>
      </FormSection>

      <FormSection title="Guardian Information" description="Parent or guardian contact details" columns={2}>
        <FormGroup label="Guardian Name" required error={errors.guardian_name}>
          <Input
            placeholder="Parent or guardian name"
            value={form.guardian.name}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, name: e.target.value } })}
          />
        </FormGroup>

        <FormGroup label="Phone" required error={errors.guardian_phone}>
          <Input
            placeholder="Contact phone number"
            type="tel"
            value={form.guardian.phone}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, phone: e.target.value } })}
          />
        </FormGroup>

        <FormGroup label="Email">
          <Input
            placeholder="Contact email address"
            type="email"
            value={form.guardian.email || ""}
            onChange={(e) => setForm({ ...form, guardian: { ...form.guardian, email: e.target.value } })}
          />
        </FormGroup>
      </FormSection>

      <Button
        type="submit"
        disabled={saving}
        style={{
          background: colors.actionBlue,
          color: "white",
          padding: `${spacing.md}px`,
          alignSelf: "flex-start"
        }}
      >
        {saving ? "Creating..." : "Create Student"}
      </Button>
    </form>
  );
}
