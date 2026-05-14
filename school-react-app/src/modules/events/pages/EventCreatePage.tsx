/**
 * Event creation as a dedicated full page.
 *
 * Visual contract follows the Academic Year reference standard:
 *   max-w-7xl mx-auto py-4 px-4 sm:px-6
 *   lg:flex-row gap-8 items-start mt-24
 *   left form 68% / right guidance panel 32%
 *   rounded-[24px] cards with shadow-[0_8px_30px_rgb(0,0,0,0.04)]
 *   ring-1 ring-slate-900/5
 *   blue-600 accent icons in 9x9 rounded-lg containers
 *   text-[10px] font-bold normal-case for eyebrow labels
 *
 * Replaces the legacy modal flow on the events list page.
 */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Input, Select } from "@/components/ui";
import { useEvents } from "../hooks/useEvents";
import { EventFormInput } from "../types/events.types";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import type { ClassRow } from "@/modules/classes/types/class.types";
import { showToast } from "@/utils/toast";

const initialForm: EventFormInput = {
  title: "",
  description: "",
  event_type: "academic",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  location: "",
  visibility: "all",
  target_class_ids: [],
  organizer: "",
  status: "scheduled",
};

const eventTypeOptions = [
  { value: "academic", label: "Academic" },
  { value: "holiday", label: "Holiday" },
  { value: "sports", label: "Sports" },
  { value: "cultural", label: "Cultural" },
  { value: "other", label: "Other" },
];

const visibilityOptions = [
  { value: "all", label: "All audiences" },
  { value: "specific_classes", label: "Specific classes" },
];

const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function EventCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isTeacher = pathname.includes("/teacher");
  const backPath = isTeacher ? "/teacher/events" : "/admin/events";

  const { addEvent } = useEvents();
  const { state: classState } = useClasses({ page: 1, limit: 200 });

  const classRows: ClassRow[] = useMemo(() => {
    const data: any = classState.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data.data) ? data.data : [];
  }, [classState.data]);

  const [form, setForm] = useState<EventFormInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Event title is required";
    if (!form.start_date) next.start_date = "Start date is required";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      next.end_date = "End date must be on or after start date";
    }
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      next.end_time = "End time must be after start time";
    }
    if (form.visibility === "specific_classes" && (form.target_class_ids?.length ?? 0) === 0) {
      next.target_class_ids = "Select at least one class for restricted visibility";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const isValid =
    form.title.trim().length > 0 &&
    !!form.start_date &&
    (form.visibility === "all" || (form.target_class_ids?.length ?? 0) > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await addEvent(form);
      if (result?.success) {
        navigate(backPath);
      } else {
        showToast(
          (result as any)?.message || (result as any)?.error?.message || "Failed to create event",
          "error"
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleClassTarget(id: string) {
    setForm((prev) => {
      const set = new Set(prev.target_class_ids ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, target_class_ids: Array.from(set) };
    });
  }

  // Reset target classes if visibility flips back to "all".
  useEffect(() => {
    if (form.visibility === "all" && (form.target_class_ids?.length ?? 0) > 0) {
      setForm((prev) => ({ ...prev, target_class_ids: [] }));
    }
  }, [form.visibility]);

  const targetCount = form.target_class_ids?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case  hover:text-slate-900 transition-all group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          Return to Events
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case ">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Calendar Composer
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-24">
        {/* LEFT SIDE: Main Form Container (68%) */}
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            {/* Premium Internal Header */}
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <span className="material-symbols-outlined text-lg">event_note</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                    Schedule a Calendar Event
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Place a milestone on the institutional calendar — academic, sports, holiday, or cultural.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-7" id="event-form-quick">
              {/* Section 1: Identity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-8">
                  <Input
                    label="Event Title"
                    placeholder="e.g., Annual Sports Day"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    error={errors.title}
                    required
                    leftIcon={<span className="material-symbols-outlined text-[18px]">title</span>}
                    className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                  />
                </div>

                <div className="lg:col-span-4">
                  <Select
                    label="Event Type"
                    value={form.event_type}
                    onChange={(e) =>
                      setForm({ ...form, event_type: e.target.value as EventFormInput["event_type"] })
                    }
                    options={eventTypeOptions}
                    className="h-11 rounded-xl text-[13px] font-medium"
                  />
                </div>
              </div>

              {/* Section 2: Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Start Date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  error={errors.start_date}
                  required
                  leftIcon={<span className="material-symbols-outlined text-[18px]">calendar_today</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />

                <Input
                  label="End Date"
                  type="date"
                  value={form.end_date || ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  error={errors.end_date}
                  leftIcon={<span className="material-symbols-outlined text-[18px]">event_busy</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />
              </div>

              {/* Section 3: Time window */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Start Time"
                  type="time"
                  value={form.start_time || ""}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  leftIcon={<span className="material-symbols-outlined text-[18px]">schedule</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.end_time || ""}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  error={errors.end_time}
                  leftIcon={<span className="material-symbols-outlined text-[18px]">schedule</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />
              </div>

              {/* Section 4: Location & organizer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Location"
                  placeholder="Auditorium, Sports Field..."
                  value={form.location || ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  leftIcon={<span className="material-symbols-outlined text-[18px]">location_on</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />
                <Input
                  label="Organizer"
                  placeholder="Optional — e.g., Sports Committee"
                  value={form.organizer || ""}
                  onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                  leftIcon={<span className="material-symbols-outlined text-[18px]">person</span>}
                  className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
                />
              </div>

              {/* Section 5: Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Visibility"
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value as EventFormInput["visibility"] })
                  }
                  options={visibilityOptions}
                  className="h-11 rounded-xl text-[13px] font-medium"
                />

                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as EventFormInput["status"] })
                  }
                  options={statusOptions}
                  className="h-11 rounded-xl text-[13px] font-medium"
                />
              </div>

              {form.visibility === "specific_classes" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 normal-case px-1">
                    Target Classes ({targetCount} selected)
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 max-h-56 overflow-y-auto">
                    {classRows.length === 0 ? (
                      <p className="text-[11px] font-medium text-slate-400 px-1 py-2">
                        No classes available yet. Create a class first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {classRows.map((c) => {
                          const checked = (form.target_class_ids ?? []).includes(c._id);
                          return (
                            <label
                              key={c._id}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                                checked
                                  ? "border-blue-300 bg-blue-50 text-blue-800"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleClassTarget(c._id)}
                                className="h-3.5 w-3.5 rounded border-slate-300"
                              />
                              <span className="text-[12px] font-medium truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {errors.target_class_ids && (
                    <p className="text-[10px] font-bold text-rose-600 px-1">{errors.target_class_ids}</p>
                  )}
                </div>
              )}

              {/* Section 6: Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 normal-case px-1">
                  Description (Optional)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[18px] text-slate-400">
                    notes
                  </span>
                  <textarea
                    placeholder="Brief notes — agenda, dress code, requirements..."
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-[13px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="-mx-6 -mb-6 mt-12 flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-8 py-5">
                <Link
                  to={backPath}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm"
                >
                  Discard Changes
                </Link>
                <Button
                  type="submit"
                  disabled={saving || !isValid}
                  className="h-11 px-8 text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2"
                >
                  {saving && (
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Publish Event
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE: Guidance Panel (32%) */}
        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <span className="material-symbols-outlined text-base">info</span>
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">
                Event Composer
              </h3>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  What lands on the calendar?
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Events are broadcast to the audience you select. Parents, students, and staff see them in
                  their dashboards and notifications.
                </p>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Visibility Rule
                </h4>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                  <p className="text-[10px] leading-snug text-blue-800 font-bold">
                    {form.visibility === "all"
                      ? "Everyone in the school will see this event."
                      : `Only ${targetCount || 0} selected class(es) will see this event.`}
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">
                  Live Preview
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">event</span>
                    <span className="text-[12px] font-bold text-slate-900 truncate">
                      {form.title || "Untitled event"}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {form.event_type}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">
                    {form.start_date || "—"}
                    {form.end_date ? ` → ${form.end_date}` : ""}
                  </div>
                  {(form.start_time || form.end_time) && (
                    <div className="text-[10px] font-medium text-slate-500">
                      {form.start_time || "—"}
                      {form.end_time ? ` to ${form.end_time}` : ""}
                    </div>
                  )}
                  {form.location && (
                    <div className="text-[10px] font-medium text-slate-500 truncate">
                      📍 {form.location}
                    </div>
                  )}
                </div>
              </section>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">
                  Quick Checklist
                </h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        form.title ? "text-emerald-500" : "text-slate-300"
                      }`}
                    >
                      check_circle
                    </span>
                    Give the event a clear title
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        form.start_date ? "text-emerald-500" : "text-slate-300"
                      }`}
                    >
                      check_circle
                    </span>
                    Pick a start date
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span
                      className={`material-symbols-outlined text-[14px] ${
                        form.visibility === "all" || targetCount > 0 ? "text-emerald-500" : "text-slate-300"
                      }`}
                    >
                      check_circle
                    </span>
                    Confirm audience
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
