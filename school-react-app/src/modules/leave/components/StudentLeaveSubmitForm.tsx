/**
 * Self-submit leave form for students. Backend resolves the requester
 * from the session (ctx.Role === "student") so we never expose a
 * requester picker — that was a quirk of the old admin-create form.
 *
 * Backend contract still expects requester_type / requester_id but
 * ignores the latter for student submissions and overrides it with the
 * session profile. We pass empty strings to make that explicit.
 */

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { LeaveFormInput } from "../types/leave.types";

const TYPE_OPTIONS: { value: LeaveFormInput["leave_type"]; label: string }[] = [
  { value: "sick", label: "Sick" },
  { value: "personal", label: "Personal" },
  { value: "family", label: "Family" },
  { value: "vacation", label: "Vacation" },
  { value: "other", label: "Other" },
];

interface Props {
  onSubmit: (data: LeaveFormInput) => Promise<{ ok?: boolean; success?: boolean } | void> | void;
  onCancel: () => void;
}

export function StudentLeaveSubmitForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<LeaveFormInput>({
    requester_type: "student",
    requester_id: "",
    leave_type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof LeaveFormInput>(key: K, value: LeaveFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const { [key as string]: _omit, ...rest } = prev;
      return rest;
    });
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.start_date) next.start_date = "Start date is required";
    if (!form.end_date) next.end_date = "End date is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      next.end_date = "End date must be on or after the start date";
    }
    if (!form.reason.trim()) next.reason = "Please describe the reason";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await onSubmit(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Leave type"
        value={form.leave_type}
        onChange={(e) => set("leave_type", e.target.value as LeaveFormInput["leave_type"])}
        options={TYPE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start date"
          type="date"
          value={form.start_date}
          onChange={(e) => set("start_date", e.target.value)}
          error={errors.start_date}
          required
        />
        <Input
          label="End date"
          type="date"
          value={form.end_date}
          onChange={(e) => set("end_date", e.target.value)}
          error={errors.end_date}
          required
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-700 normal-case mb-1.5">
          Reason
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <textarea
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          rows={4}
          placeholder="Tell us why you need this leave…"
          className={`w-full rounded-lg border bg-white p-2.5 text-sm text-slate-800 outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
            errors.reason
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/10"
          }`}
        />
        {errors.reason && (
          <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.reason}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
        <Button
          type="submit"
          disabled={busy}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold gap-2"
        >
          {busy ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
