import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppIcon } from "shared/ui/AppIcon";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Badge, Button, ConfirmModal, Drawer, Input, Select, Skeleton } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import { useAuth } from "@/hooks/useAuth";
import { ScheduleSidebar } from "./sidebar";

type ScheduleTab = "calendar" | "tasks" | "reminders" | "recurring";

interface ScheduleRecord {
  _id: string;
  school_id: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day?: boolean;
  event_type: "meeting" | "task" | "event" | "reminder" | "class" | string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status: "pending" | "in_progress" | "completed" | "missed" | "cancelled" | string;
  color?: string;
  location?: string;
  reminder_type?: "none" | "at_time" | "30min" | "1hour" | "1day" | string;
  recurring_type?: "none" | "daily" | "weekly" | "monthly" | "custom" | string;
  recurring_end?: string;
  assigned_to?: string[];
  created_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ScheduleFormState {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  event_type: string;
  priority: string;
  status: string;
  color: string;
  location: string;
  reminder_type: string;
  recurring_type: string;
  recurring_end: string;
  assigned_to: string;
  notes: string;
}

const defaultForm = (): ScheduleFormState => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: "",
    description: "",
    start_datetime: toLocalInput(start),
    end_datetime: toLocalInput(end),
    all_day: false,
    event_type: "event",
    priority: "medium",
    status: "pending",
    color: "#2563eb",
    location: "",
    reminder_type: "none",
    recurring_type: "none",
    recurring_end: "",
    assigned_to: "",
    notes: "",
  };
};

const eventTypeOptions = [
  { label: "Event", value: "event" },
  { label: "Meeting", value: "meeting" },
  { label: "Task", value: "task" },
  { label: "Reminder", value: "reminder" },
  { label: "Class", value: "class" },
];

const priorityOptions = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Missed", value: "missed" },
  { label: "Cancelled", value: "cancelled" },
];

const reminderOptions = [
  { label: "None", value: "none" },
  { label: "At time", value: "at_time" },
  { label: "30 minutes before", value: "30min" },
  { label: "1 hour before", value: "1hour" },
  { label: "1 day before", value: "1day" },
];

const recurringOptions = [
  { label: "None", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

function toLocalInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function toApiDatetime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function dateKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMonth(value: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(value);
}

function parseAssignedTo(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromRecord(record: ScheduleRecord): ScheduleFormState {
  return {
    title: record.title || "",
    description: record.description || "",
    start_datetime: toLocalInput(record.start_datetime),
    end_datetime: toLocalInput(record.end_datetime),
    all_day: Boolean(record.all_day),
    event_type: record.event_type || "event",
    priority: record.priority || "medium",
    status: record.status || "pending",
    color: record.color || "#2563eb",
    location: record.location || "",
    reminder_type: record.reminder_type || "none",
    recurring_type: record.recurring_type || "none",
    recurring_end: record.recurring_end ? toLocalInput(record.recurring_end) : "",
    assigned_to: (record.assigned_to || []).join(", "),
    notes: record.notes || "",
  };
}

function payloadFromForm(form: ScheduleFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    start_datetime: toApiDatetime(form.start_datetime),
    end_datetime: toApiDatetime(form.end_datetime),
    all_day: form.all_day,
    event_type: form.event_type,
    priority: form.priority,
    status: form.status,
    color: form.color,
    location: form.location.trim(),
    reminder_type: form.reminder_type,
    recurring_type: form.recurring_type,
    recurring_end: form.recurring_end ? toApiDatetime(form.recurring_end) : "",
    assigned_to: parseAssignedTo(form.assigned_to),
    notes: form.notes.trim(),
  };
}

function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return d;
  });
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ScheduleTab>("calendar");
  const [month, setMonth] = useState(() => new Date());
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRecord | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(() => defaultForm());
  const [deleteTarget, setDeleteTarget] = useState<ScheduleRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadSchedules() {
    setLoading(true);
    const result = await serviceRequest<ScheduleRecord[]>("/api/schedules", {}, 0);
    if (result.ok) {
      setSchedules(Array.isArray(result.data) ? result.data : []);
    } else {
      showToast(result.message || "Could not load schedules.", "error");
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadSchedules();
  }, []);

  const visibleSchedules = useMemo(() => {
    const rows = schedules.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (activeTab === "tasks" && item.event_type !== "task") return false;
      if (activeTab === "reminders" && (!item.reminder_type || item.reminder_type === "none")) return false;
      if (activeTab === "recurring" && (!item.recurring_type || item.recurring_type === "none")) return false;
      return true;
    });
    return [...rows].sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
  }, [activeTab, schedules, statusFilter]);

  const calendarDays = useMemo(() => monthGrid(month), [month]);
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleRecord[]>();
    for (const schedule of visibleSchedules) {
      const key = dateKey(schedule.start_datetime);
      map.set(key, [...(map.get(key) || []), schedule]);
    }
    return map;
  }, [visibleSchedules]);

  const stats = useMemo(() => {
    const today = dateKey(new Date());
    return {
      today: schedules.filter((item) => dateKey(item.start_datetime) === today).length,
      pending: schedules.filter((item) => item.status === "pending").length,
      reminders: schedules.filter((item) => item.reminder_type && item.reminder_type !== "none").length,
      recurring: schedules.filter((item) => item.recurring_type && item.recurring_type !== "none").length,
    };
  }, [schedules]);

  function openCreate() {
    setEditing(null);
    setForm(defaultForm());
    setDrawerOpen(true);
  }

  function openEdit(record: ScheduleRecord) {
    setEditing(record);
    setForm(formFromRecord(record));
    setDrawerOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    if (!form.start_datetime || !form.end_datetime) {
      showToast("Start and end time are required.", "error");
      return;
    }
    if (new Date(form.end_datetime) <= new Date(form.start_datetime)) {
      showToast("End time must be after start time.", "error");
      return;
    }
    const payload = payloadFromForm(form);
    setSaving(true);
    const result = editing
      ? await serviceRequest<ScheduleRecord>(`/api/schedules/${encodeURIComponent(editing._id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await serviceRequest<ScheduleRecord>("/api/schedules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message || "Could not save schedule.", "error");
      return;
    }
    showToast(editing ? "Schedule updated." : "Schedule created.", "success");
    setDrawerOpen(false);
    await loadSchedules();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    const result = await serviceRequest(`/api/schedules/${encodeURIComponent(deleteTarget._id)}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message || "Could not delete schedule.", "error");
      return;
    }
    showToast("Schedule deleted.", "success");
    setDeleteTarget(null);
    await loadSchedules();
  }

  async function markComplete(record: ScheduleRecord) {
    const result = await serviceRequest<ScheduleRecord>(
      `/api/schedules/${encodeURIComponent(record._id)}/complete`,
      { method: "POST" }
    );
    if (!result.ok) {
      showToast(result.message || "Could not complete schedule.", "error");
      return;
    }
    showToast("Schedule completed.", "success");
    await loadSchedules();
  }

  const shellTitle = user?.role === "teacher" ? "Teacher Schedule" : "Schedule";

  return (
    <SchoolShell eyebrow="Operations" title={shellTitle}>
      <div className="flex min-h-[calc(100vh-7rem)] bg-slate-50/70 -m-4 sm:-m-6 lg:-m-8">
        <ScheduleSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ScheduleTab)} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{formatMonth(month)}</h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {visibleSchedules.length} visible of {schedules.length} total
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(String(e.target.value))}
                options={[{ label: "All status", value: "all" }, ...statusOptions]}
                className="min-w-[150px]"
              />
              <Button variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <AppIcon name="ChevronLeft" size={16} />
              </Button>
              <Button variant="ghost" onClick={() => setMonth(new Date())}>Today</Button>
              <Button variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                <AppIcon name="ChevronRight" size={16} />
              </Button>
              <Button onClick={openCreate}>
                <AppIcon name="Plus" size={16} />
                New
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat label="Today" value={stats.today} icon="CalendarDays" />
            <Stat label="Pending" value={stats.pending} icon="Clock" />
            <Stat label="Reminders" value={stats.reminders} icon="Bell" />
            <Stat label="Recurring" value={stats.recurring} icon="Repeat" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
              <Skeleton className="h-[520px] rounded-xl" />
              <Skeleton className="h-[520px] rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="px-3 py-2 text-[11px] font-black text-slate-500">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const key = dateKey(day);
                    const items = byDay.get(key) || [];
                    const inMonth = day.getMonth() === month.getMonth();
                    const isToday = key === dateKey(new Date());
                    return (
                      <div
                        key={key}
                        className={`min-h-[112px] border-r border-b border-slate-100 p-2 ${
                          inMonth ? "bg-white" : "bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`h-6 min-w-6 px-1.5 rounded-md text-[11px] font-black inline-flex items-center justify-center ${
                              isToday ? "bg-blue-600 text-white" : inMonth ? "text-slate-700" : "text-slate-400"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {items.slice(0, 3).map((item) => (
                            <button
                              key={item._id}
                              type="button"
                              onClick={() => openEdit(item)}
                              className="w-full text-left rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                            >
                              <span className="block truncate text-[11px] font-black text-slate-800">
                                {item.title}
                              </span>
                              <span className="block text-[10px] font-semibold text-slate-500">
                                {formatDateTime(item.start_datetime).split(",").pop()?.trim()}
                              </span>
                            </button>
                          ))}
                          {items.length > 3 && (
                            <span className="text-[10px] font-bold text-slate-400">+{items.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Agenda</h3>
                  <Badge variant="gray">{visibleSchedules.length}</Badge>
                </div>
                <div className="max-h-[624px] overflow-y-auto divide-y divide-slate-100">
                  {visibleSchedules.length === 0 ? (
                    <div className="p-6 text-center">
                      <AppIcon name="Calendar" size={28} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-sm font-black text-slate-700">No schedules found</p>
                    </div>
                  ) : (
                    visibleSchedules.map((item) => (
                      <ScheduleRow
                        key={item._id}
                        item={item}
                        onEdit={() => openEdit(item)}
                        onDelete={() => setDeleteTarget(item)}
                        onComplete={() => markComplete(item)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} width="max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">{editing ? "Edit schedule" : "New schedule"}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{editing ? editing.title : "Calendar item"}</p>
            </div>
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>
              <AppIcon name="X" size={16} />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <Input label="Title" value={form.title} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Type" value={form.event_type} options={eventTypeOptions} onChange={(e) => setForm((f) => ({ ...f, event_type: String(e.target.value) }))} />
              <Select label="Priority" value={form.priority} options={priorityOptions} onChange={(e) => setForm((f) => ({ ...f, priority: String(e.target.value) }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Start" type="datetime-local" value={form.start_datetime} required onChange={(e) => setForm((f) => ({ ...f, start_datetime: e.target.value }))} />
              <Input label="End" type="datetime-local" value={form.end_datetime} required onChange={(e) => setForm((f) => ({ ...f, end_datetime: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Status" value={form.status} options={statusOptions} onChange={(e) => setForm((f) => ({ ...f, status: String(e.target.value) }))} />
              <Input label="Color" type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Reminder" value={form.reminder_type} options={reminderOptions} onChange={(e) => setForm((f) => ({ ...f, reminder_type: String(e.target.value) }))} />
              <Select label="Repeat" value={form.recurring_type} options={recurringOptions} onChange={(e) => setForm((f) => ({ ...f, recurring_type: String(e.target.value) }))} />
            </div>
            {form.recurring_type !== "none" && (
              <Input label="Repeat until" type="datetime-local" value={form.recurring_end} onChange={(e) => setForm((f) => ({ ...f, recurring_end: e.target.value }))} />
            )}
            <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Input label="Assigned user IDs" value={form.assigned_to} onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))} />
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <input
                type="checkbox"
                checked={form.all_day}
                onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              All day
            </label>
            <Textarea label="Description" value={form.description} onChange={(value) => setForm((f) => ({ ...f, description: value }))} />
            <Textarea label="Notes" value={form.notes} onChange={(value) => setForm((f) => ({ ...f, notes: value }))} />
          </div>

          <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete schedule"
        message="This schedule and its pending reminders will be removed."
        itemName={deleteTarget?.title}
        confirmLabel="Delete"
        isLoading={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </SchoolShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
        <AppIcon name={icon as any} size={18} />
      </div>
      <div>
        <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        <p className="text-[11px] font-bold text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function ScheduleRow({
  item,
  onEdit,
  onDelete,
  onComplete,
}: {
  item: ScheduleRecord;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color || "#2563eb" }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2 justify-between">
            <button type="button" onClick={onEdit} className="text-left min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{item.title}</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{formatDateTime(item.start_datetime)}</p>
            </button>
            <Badge variant={item.status === "completed" ? "success" : item.status === "cancelled" ? "error" : "primary"}>
              {item.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip icon="Tag" label={item.event_type} />
            <Chip icon="Flag" label={item.priority} />
            {item.reminder_type && item.reminder_type !== "none" && <Chip icon="Bell" label={item.reminder_type} />}
            {item.recurring_type && item.recurring_type !== "none" && <Chip icon="Repeat" label={item.recurring_type} />}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {item.status !== "completed" && (
              <Button variant="ghost" size="sm" onClick={onComplete}>
                <AppIcon name="Check" size={14} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <AppIcon name="Pencil" size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <AppIcon name="Trash2" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-500">
      <AppIcon name={icon as any} size={12} />
      {label}
    </span>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 w-full">
      <span className="text-[11px] font-bold text-slate-500 normal-case mb-1 px-1">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5"
      />
    </label>
  );
}
