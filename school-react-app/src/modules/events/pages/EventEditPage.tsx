import { AppIcon } from "shared/ui/AppIcon";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { 
  Button, 
  Input, 
  Select, 
  EntityCreateLayout, 
  GuidanceSection, 
  GuidanceCallout, 
  GuidanceChecklist,
  Skeleton,
  DataState
} from "@/components/ui";
import { useEvents, useEvent } from "../hooks/useEvents";
import { EventFormInput } from "../types/events.types";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import type { ClassRow } from "@/modules/classes/types/class.types";
import { showToast } from "@/utils/toast";

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

export function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const isTeacher = pathname.includes("/teacher");
  const backPath = isTeacher ? "/teacher/events" : "/admin/events";

  const { updateEvent } = useEvents();
  const { state: eventState } = useEvent(id);
  const { state: classState } = useClasses({ page: 1, limit: 200 });

  const classRows: ClassRow[] = useMemo(() => {
    const data: any = classState.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Array.isArray(data.data) ? data.data : [];
  }, [classState.data]);

  const [form, setForm] = useState<EventFormInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventState.data) {
      setForm({
        title: eventState.data.title,
        description: eventState.data.description || "",
        event_type: eventState.data.event_type as any,
        start_date: eventState.data.start_date,
        end_date: eventState.data.end_date || "",
        start_time: eventState.data.start_time || "",
        end_time: eventState.data.end_time || "",
        location: eventState.data.location || "",
        visibility: eventState.data.visibility as any,
        target_class_ids: eventState.data.target_class_ids || [],
        organizer: eventState.data.organizer || "",
        status: eventState.data.status as any,
      });
    }
  }, [eventState.data]);

  function validate(): boolean {
    if (!form) return false;
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

  const isValid = form &&
    form.title.trim().length > 0 &&
    !!form.start_date &&
    (form.visibility === "all" || (form.target_class_ids?.length ?? 0) > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !id || !validate()) return;
    setSaving(true);
    try {
      const result = await updateEvent(id, form);
      if (result?.success) {
        navigate(backPath);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleClassTarget(classId: string) {
    if (!form) return;
    setForm((prev) => {
      if (!prev) return null;
      const set = new Set(prev.target_class_ids ?? []);
      if (set.has(classId)) set.delete(classId);
      else set.add(classId);
      return { ...prev, target_class_ids: Array.from(set) };
    });
  }

  useEffect(() => {
    if (form?.visibility === "all" && (form.target_class_ids?.length ?? 0) > 0) {
      setForm((prev) => prev ? ({ ...prev, target_class_ids: [] }) : null);
    }
  }, [form?.visibility]);

  const targetCount = form?.target_class_ids?.length ?? 0;

  if (eventState.status === "loading" || !form) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-2 h-[600px] rounded-[24px]" />
           <Skeleton className="h-[400px] rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (eventState.status === "error") {
    return <DataState variant="error" title="Event not found" message={eventState.error} />;
  }

  return (
    <EntityCreateLayout
      backTo={backPath}
      backLabel="Return to Events"
      eyebrow="Calendar Composer"
      icon="edit_square"
      title="Edit Calendar Event"
      subtitle="Update the details of this institutional milestone."
      asideTitle="Event Composer"
      aside={
        <>
          <GuidanceSection title="What lands on the calendar?">
            Events are broadcast to the audience you select. Parents, students, and staff see them in
            their dashboards and notifications.
          </GuidanceSection>

          <GuidanceSection title="Visibility Rule">
            <GuidanceCallout tone="blue">
              {form.visibility === "all"
                ? "Everyone in the school will see this event."
                : `Only ${targetCount || 0} selected class(es) will see this event.`}
            </GuidanceCallout>
          </GuidanceSection>

          <GuidanceSection title="Live Preview">
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AppIcon name="Calendar" size={18} className="text-blue-600" />
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
          </GuidanceSection>

          <GuidanceChecklist
            items={[
              { done: !!form.title, label: "Give the event a clear title" },
              { done: !!form.start_date, label: "Pick a start date" },
              { done: form.visibility === "all" || targetCount > 0, label: "Confirm audience" },
            ]}
          />
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-7" id="event-form-edit">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <Input
              label="Event Title"
              placeholder="e.g., Annual Sports Day"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={errors.title}
              required
              leftIcon={<AppIcon name="Title" size={18} />}
              className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
            />
          </div>

          <div className="lg:col-span-4">
            <Select
              label="Event Type"
              value={form.event_type}
              onChange={(e) =>
                setForm({ ...form, event_type: e.target.value as any })
              }
              options={eventTypeOptions}
              className="h-11 rounded-xl text-[13px] font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            error={errors.start_date}
            required
            leftIcon={<AppIcon name="Calendar" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />

          <Input
            label="End Date"
            type="date"
            value={form.end_date || ""}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            error={errors.end_date}
            leftIcon={<AppIcon name="CalendarX" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Start Time"
            type="time"
            value={form.start_time || ""}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            leftIcon={<AppIcon name="Clock" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />
          <Input
            label="End Time"
            type="time"
            value={form.end_time || ""}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            error={errors.end_time}
            leftIcon={<AppIcon name="Clock" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Location"
            placeholder="Auditorium, Sports Field..."
            value={form.location || ""}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            leftIcon={<AppIcon name="MapPin" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />
          <Input
            label="Organizer"
            placeholder="Optional — e.g., Sports Committee"
            value={form.organizer || ""}
            onChange={(e) => setForm({ ...form, organizer: e.target.value })}
            leftIcon={<AppIcon name="User" size={18} />}
            className="bg-white border-slate-200 h-11 focus:border-blue-600 focus:ring-blue-600/5 transition-all text-[13px] font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Visibility"
            value={form.visibility}
            onChange={(e) =>
              setForm({ ...form, visibility: e.target.value as any })
            }
            options={visibilityOptions}
            className="h-11 rounded-xl text-[13px] font-medium"
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as any })
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

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 normal-case px-1">
            Description (Optional)
          </label>
          <div className="relative">
            <AppIcon name="StickyNote" size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
            <textarea
              placeholder="Brief notes — agenda, dress code, requirements..."
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full min-h-[100px] rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-[13px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>

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
            Update Event
          </Button>
        </div>
      </form>
    </EntityCreateLayout>
  );
}
