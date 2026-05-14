import { useState } from "react";
import { EventFormInput } from "../types/events.types";

interface Props {
  initial?: Partial<EventFormInput>;
  onSubmit: (data: EventFormInput) => void;
  onCancel: () => void;
}

export default function EventForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<EventFormInput>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    event_type: initial?.event_type ?? "other",
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    start_time: initial?.start_time ?? "",
    end_time: initial?.end_time ?? "",
    location: initial?.location ?? "",
    visibility: initial?.visibility ?? "all",
    target_class_ids: initial?.target_class_ids ?? [],
    organizer: initial?.organizer ?? "",
    status: initial?.status ?? "scheduled"
  });

  const handleChange = (field: keyof EventFormInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange("title", e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange("description", e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Event Type</label>
          <select
            value={form.event_type}
            onChange={e => handleChange("event_type", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="academic">Academic</option>
            <option value="holiday">Holiday</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select
            value={form.visibility}
            onChange={e => handleChange("visibility", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="all">All</option>
            <option value="specific_classes">Specific Classes</option>
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
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Time</label>
          <input
            type="time"
            value={form.start_time}
            onChange={e => handleChange("start_time", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={e => handleChange("end_time", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={form.location}
          onChange={e => handleChange("location", e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Organizer</label>
        <input
          type="text"
          value={form.organizer}
          onChange={e => handleChange("organizer", e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          value={form.status}
          onChange={e => handleChange("status", e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="scheduled">Scheduled</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
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
