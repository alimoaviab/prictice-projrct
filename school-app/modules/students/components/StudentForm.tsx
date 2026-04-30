"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { spacing } from "@edu/shared/design-system/tokens";
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

export function StudentForm({ onCreate }: { onCreate: (input: StudentFormInput) => Promise<unknown> }) {
  const [form, setForm] = useState<StudentFormInput>(initialForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.md }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: spacing.md }}>
        <Input
          label="Admission No"
          name="admission_no"
          value={form.admission_no}
          onChange={(event) => setForm({ ...form, admission_no: event.target.value })}
        />
        <Input
          label="Class Id"
          name="class_id"
          value={form.class_id}
          onChange={(event) => setForm({ ...form, class_id: event.target.value })}
        />
        <Input
          label="First Name"
          name="first_name"
          value={form.first_name}
          onChange={(event) => setForm({ ...form, first_name: event.target.value })}
        />
        <Input
          label="Last Name"
          name="last_name"
          value={form.last_name}
          onChange={(event) => setForm({ ...form, last_name: event.target.value })}
        />
        <Input
          label="Section"
          name="section"
          value={form.section}
          onChange={(event) => setForm({ ...form, section: event.target.value })}
        />
        <Input
          label="Guardian"
          name="guardian_name"
          value={form.guardian.name}
          onChange={(event) => setForm({ ...form, guardian: { ...form.guardian, name: event.target.value } })}
        />
        <Input
          label="Guardian Phone"
          name="guardian_phone"
          value={form.guardian.phone}
          onChange={(event) => setForm({ ...form, guardian: { ...form.guardian, phone: event.target.value } })}
        />
        <Input
          label="Guardian Email"
          name="guardian_email"
          value={form.guardian.email}
          onChange={(event) => setForm({ ...form, guardian: { ...form.guardian, email: event.target.value } })}
        />
      </div>
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving" : "Create Student"}
        </Button>
      </div>
    </form>
  );
}
