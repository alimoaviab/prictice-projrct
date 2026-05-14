import { useState } from "react";
import { LeaveFormInput } from "../types/leave.types";

interface Props {
  initial?: Partial<LeaveFormInput>;
  onSubmit: (data: LeaveFormInput) => void;
  onCancel: () => void;
  requesters: { _id: string; name: string; type: "student" | "teacher" }[];
}

export default function LeaveForm({ initial, onSubmit, onCancel, requesters }: Props) {
  const [form, setForm] = useState<LeaveFormInput>({
    requester_type: initial?.requester_type ?? "student",
    requester_id: initial?.requester_id ?? "",
    leave_type: initial?.leave_type ?? "sick",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    reason: initial?.reason ?? ""
  });

  const handleChange = (field: keyof LeaveFormInput, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Reset requester ID if type changes
      if (field === "requester_type") {
        next.requester_id = "";
      }
      return next;
    });
  };

  const filteredRequesters = requesters.filter(r => r.type === form.requester_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Requester Type</label>
          <select
            value={form.requester_type}
            onChange={e => handleChange("requester_type", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Requester</label>
          <select
            value={form.requester_id}
            onChange={e => handleChange("requester_id", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select Requester</option>
            {filteredRequesters.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Leave Type</label>
          <select
            value={form.leave_type}
            onChange={e => handleChange("leave_type", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="sick">Sick</option>
            <option value="personal">Personal</option>
            <option value="family">Family</option>
            <option value="vacation">Vacation</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={form.start_date}
            onChange={e => handleChange("start_date", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={form.end_date}
            onChange={e => handleChange("end_date", e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reason</label>
        <textarea
          value={form.reason}
          onChange={e => handleChange("reason", e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          {initial ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
