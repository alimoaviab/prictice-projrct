import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Schedule {
  _id: string;
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
  assigned_to: string[];
  created_by: string;
  notes: string;
  created_at: string;
}

type ViewMode = "month" | "week" | "day";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-green-500",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-indigo-500",
  task: "bg-amber-500",
  event: "bg-blue-500",
  reminder: "bg-purple-500",
  class: "bg-emerald-500",
};

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-100 text-yellow-700", text: "Pending" },
  in_progress: { bg: "bg-blue-100 text-blue-700", text: "In Progress" },
  completed: { bg: "bg-green-100 text-green-700", text: "Completed" },
  missed: { bg: "bg-red-100 text-red-700", text: "Missed" },
  cancelled: { bg: "bg-gray-100 text-gray-500", text: "Cancelled" },
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const token = localStorage.getItem("token") ?? "";

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Calculate date range based on view
      const start = new Date(currentDate);
      const end = new Date(currentDate);
      if (viewMode === "month") {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
      } else if (viewMode === "week") {
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        end.setDate(end.getDate() + (6 - day));
      }
      params.set("start", start.toISOString().split("T")[0]);
      params.set("end", end.toISOString().split("T")[0]);
      if (filterType) params.set("event_type", filterType);

      const res = await fetch(`/api/schedules?${params}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.ok) {
        setSchedules(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode, filterType, token]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.filter((s) => {
      const start = s.start_datetime.split("T")[0];
      const end = s.end_datetime.split("T")[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") newDate.setMonth(newDate.getMonth() + direction);
    else if (viewMode === "week") newDate.setDate(newDate.getDate() + direction * 7);
    else newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const handleCreateSchedule = async (formData: any) => {
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data?.ok) {
        setShowCreateModal(false);
        loadSchedules();
      }
    } catch {
      // ignore
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await fetch(`/api/schedules/${id}/complete`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      loadSchedules();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await fetch(`/api/schedules/${id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      loadSchedules();
      setSelectedSchedule(null);
    } catch {
      // ignore
    }
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Schedule & Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage events, tasks, meetings & reminders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          <AppIcon name="Plus" size={16} />
          New Schedule
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
        {/* View Toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(["month", "week", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-[10px] font-bold capitalize transition-all ${
                viewMode === mode ? "bg-blue-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all">
            <AppIcon name="ChevronLeft" size={16} className="text-slate-500" />
          </button>
          <span className="text-sm font-bold text-slate-800 min-w-[140px] text-center">{monthName}</span>
          <button onClick={() => navigateDate(1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all">
            <AppIcon name="ChevronRight" size={16} className="text-slate-500" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-[10px] font-bold text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-[10px] font-bold border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600"
          >
            <option value="">All Types</option>
            <option value="meeting">Meetings</option>
            <option value="task">Tasks</option>
            <option value="event">Events</option>
            <option value="reminder">Reminders</option>
            <option value="class">Classes</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-[10px] font-bold border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      ) : viewMode === "month" ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 42 }, (_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
              const isToday = isCurrentMonth && cellDate.toDateString() === new Date().toDateString();
              const daySchedules = isCurrentMonth ? getSchedulesForDate(cellDate) : [];

              return (
                <div
                  key={i}
                  className={`min-h-[80px] border-b border-r border-slate-50 p-1 transition-all ${
                    isCurrentMonth ? "bg-white hover:bg-slate-50/50" : "bg-slate-50/30"
                  } ${isToday ? "ring-1 ring-inset ring-blue-200 bg-blue-50/30" : ""}`}
                >
                  {isCurrentMonth && (
                    <>
                      <span className={`text-[11px] font-bold ${isToday ? "text-blue-600" : "text-slate-600"}`}>
                        {dayNum}
                      </span>
                      <div className="space-y-0.5 mt-0.5">
                        {daySchedules.slice(0, 3).map((s) => (
                          <button
                            key={s._id}
                            onClick={() => setSelectedSchedule(s)}
                            className={`w-full text-left px-1 py-0.5 rounded text-[9px] font-bold text-white truncate ${
                              s.color ? "" : EVENT_TYPE_COLORS[s.event_type] || "bg-blue-500"
                            }`}
                            style={s.color ? { backgroundColor: s.color } : undefined}
                          >
                            {s.title}
                          </button>
                        ))}
                        {daySchedules.length > 3 && (
                          <span className="text-[9px] text-slate-400 font-bold">+{daySchedules.length - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view for week/day */
        <div className="space-y-2">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
              <AppIcon name="Calendar" size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-bold">No schedules for this period</p>
            </div>
          ) : (
            schedules
              .filter((s) => !filterPriority || s.priority === filterPriority)
              .map((s) => (
                <div
                  key={s._id}
                  onClick={() => setSelectedSchedule(s)}
                  className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className={`w-1 h-10 rounded-full ${PRIORITY_COLORS[s.priority] || "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{s.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_BADGES[s.status]?.bg || ""}`}>
                        {STATUS_BADGES[s.status]?.text || s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <AppIcon name="Clock" size={12} />
                        {new Date(s.start_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(s.end_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${EVENT_TYPE_COLORS[s.event_type] || "bg-blue-500"}`}>
                        {s.event_type}
                      </span>
                      {s.recurring_type !== "none" && (
                        <span className="text-[9px] text-purple-500 font-bold flex items-center gap-0.5">
                          <AppIcon name="Repeat" size={10} /> {s.recurring_type}
                        </span>
                      )}
                    </div>
                  </div>
                  {s.status === "pending" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkComplete(s._id); }}
                      className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-all"
                      title="Mark Complete"
                    >
                      <AppIcon name="CheckCircle" size={18} />
                    </button>
                  )}
                </div>
              ))
          )}
        </div>
      )}

      {/* Schedule Detail Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedSchedule(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedSchedule.title}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold text-white ${EVENT_TYPE_COLORS[selectedSchedule.event_type] || "bg-blue-500"}`}>
                  {selectedSchedule.event_type}
                </span>
              </div>
              <button onClick={() => setSelectedSchedule(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <AppIcon name="X" size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {selectedSchedule.description && (
                <p className="text-slate-600 text-xs">{selectedSchedule.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AppIcon name="Calendar" size={14} />
                <span>{new Date(selectedSchedule.start_datetime).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AppIcon name="Clock" size={14} />
                <span>
                  {new Date(selectedSchedule.start_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" → "}
                  {new Date(selectedSchedule.end_datetime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {selectedSchedule.location && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AppIcon name="MapPin" size={14} />
                  <span>{selectedSchedule.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGES[selectedSchedule.status]?.bg}`}>
                  {STATUS_BADGES[selectedSchedule.status]?.text}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${PRIORITY_COLORS[selectedSchedule.priority]}`}>
                  {selectedSchedule.priority}
                </span>
              </div>
              {selectedSchedule.notes && (
                <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600">{selectedSchedule.notes}</div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              {selectedSchedule.status === "pending" && (
                <button
                  onClick={() => { handleMarkComplete(selectedSchedule._id); setSelectedSchedule(null); }}
                  className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700"
                >
                  Mark Complete
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedSchedule._id)}
                className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateScheduleModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSchedule}
          isAdmin={user?.role === "admin" || user?.role === "super_admin"}
        />
      )}
    </div>
  );
}

// ─── Create Schedule Modal ───────────────────────────────────────────────

function CreateScheduleModal({
  onClose,
  onSubmit,
  isAdmin,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isAdmin: boolean;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_datetime: "",
    end_datetime: "",
    all_day: false,
    event_type: "event",
    priority: "medium",
    color: "",
    location: "",
    reminder_type: "none",
    recurring_type: "none",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { ...form };
    if (data.start_datetime) data.start_datetime = new Date(data.start_datetime).toISOString();
    if (data.end_datetime) data.end_datetime = new Date(data.end_datetime).toISOString();
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-slate-900">New Schedule</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <AppIcon name="X" size={18} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="Meeting with parents..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
              rows={2}
              placeholder="Optional details..."
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Start *</label>
              <input
                type="datetime-local"
                required
                value={form.start_datetime}
                onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">End</label>
              <input
                type="datetime-local"
                value={form.end_datetime}
                onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Type</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
                <option value="task">Task</option>
                <option value="reminder">Reminder</option>
                <option value="class">Class</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Reminder & Recurring */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Reminder</label>
              <select
                value={form.reminder_type}
                onChange={(e) => setForm({ ...form, reminder_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="none">No Reminder</option>
                <option value="at_time">At Event Time</option>
                <option value="30min">30 Minutes Before</option>
                <option value="1hour">1 Hour Before</option>
                <option value="1day">1 Day Before</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Recurring</label>
              <select
                value={form.recurring_type}
                onChange={(e) => setForm({ ...form, recurring_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="none">No Repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              placeholder="Room 101, Online, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            Create Schedule
          </button>
        </form>
      </div>
    </div>
  );
}
