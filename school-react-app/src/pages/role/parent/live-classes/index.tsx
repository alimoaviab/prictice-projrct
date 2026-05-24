import { AppIcon } from "shared/ui/AppIcon";
/**
 * Parent Live Classes — premium redesign that matches the admin/parent
 * portals' compact aesthetic introduced on the dashboards.
 *
 * Visual contract:
 *   - Compact hero strip with the selected child's identity, class, and a
 *     pulsing "live now" indicator when one of their sessions is active.
 *   - 4-up KPI row using StatCardCompact (admin pattern).
 *   - Filter bar with search + status dropdown.
 *   - Timeline-style session list with circular markers and a soft vertical
 *     spine (mirrors the admin live-class timeline).
 *   - Premium empty + loading states.
 *
 * API contract is preserved — same `GET /api/parent/live-classes?student_id=`
 * call, same response shape, same auto-refresh cadence.
 */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { StatCardCompact } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { serviceRequest } from "@/services/service-client";

interface LiveClassItem {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  teacher_name: string;
  class_name: string;
  starts_at: string;
  ends_at: string;
  join_url: string;
  provider: string;
  status: "live" | "upcoming" | "ended";
}

type StatusFilter = "all" | "live" | "upcoming" | "ended";

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────

export function ParentLiveClassesPage() {
  const { selectedChild } = useSelectedChild();
  const studentId = selectedChild?.student_id || "";

  const {
    data: meetings = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<LiveClassItem[]>({
    queryKey: ["parent-live-classes", studentId],
    queryFn: async () => {
      const params = studentId ? `?student_id=${studentId}` : "";
      const res = await serviceRequest<LiveClassItem[]>(
        `/api/parent/live-classes${params}`,
      );
      if (!res.ok) throw new Error(res.error?.message || "Failed to load");
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ────────────────────────────────────────────────────────────────────
  // Derived data
  // ────────────────────────────────────────────────────────────────────

  const liveMeetings = meetings.filter((m) => m.status === "live");
  const upcomingMeetings = meetings.filter((m) => m.status === "upcoming");
  const endedMeetings = meetings.filter((m) => m.status === "ended");

  const todayMeetings = useMemo(() => {
    const today = new Date();
    return meetings.filter((m) => {
      const d = new Date(m.starts_at);
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    });
  }, [meetings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetings
      .filter((m) =>
        statusFilter === "all" ? true : m.status === statusFilter,
      )
      .filter((m) => {
        if (!q) return true;
        return (
          m.title.toLowerCase().includes(q) ||
          (m.subject || "").toLowerCase().includes(q) ||
          (m.teacher_name || "").toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );
  }, [meetings, search, statusFilter]);

  const hasLiveNow = liveMeetings.length > 0;

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell title="Live Classes" eyebrow="Academic">
      {/* ── Hero strip ───────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Live Sessions
            </span>
            {selectedChild ? (
              <span className="text-[10px] font-bold text-slate-400 normal-case truncate">
                Viewing: {selectedChild.student_name}
              </span>
            ) : null}
            {hasLiveNow ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[9px] font-black text-rose-600 uppercase tracking-wider border border-rose-100 inline-flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
                {liveMeetings.length} live now
              </span>
            ) : null}
          </div>

          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Online Classroom Schedule
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {selectedChild ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="GraduationCap" size={14} />
                <span className="text-[11px] font-bold">
                  {selectedChild.class_name}
                  {selectedChild.class_section
                    ? ` - ${selectedChild.class_section}`
                    : ""}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="Calendar" size={14} />
              <span className="text-[11px] font-bold">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="RefreshCw" size={14} />
              <span className="text-[11px] font-bold">Auto-refresh every 60s</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 hover:border-blue-200 hover:text-blue-600 transition-all"
        >
          <AppIcon name="RefreshCw" size={16} className={` text-[16px] ${isFetching ? "animate-spin text-blue-600" : ""} `} />
          Refresh
        </button>

        <AppIcon name="Video" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardCompact
          label="Live Now"
          value={liveMeetings.length}
          icon="videocam"
          accent="rose"
          hint={hasLiveNow ? "Click below to join" : "No active sessions"}
        />
        <StatCardCompact
          label="Today"
          value={todayMeetings.length}
          icon="today"
          accent="blue"
          hint="Scheduled today"
        />
        <StatCardCompact
          label="Upcoming"
          value={upcomingMeetings.length}
          icon="event"
          accent="purple"
          hint="Across all dates"
        />
        <StatCardCompact
          label="Completed"
          value={endedMeetings.length}
          icon="task_alt"
          accent="emerald"
          hint="This term"
        />
      </div>

      {/* ── "Live now" banner ─────────────────────────────────────────── */}
      {hasLiveNow ? (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/60 to-white border border-rose-100 p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AppIcon name="Video" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  Live now
                </span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
              </div>
              <p className="text-[13px] font-black text-slate-900 truncate">
                {liveMeetings[0].title}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                {liveMeetings[0].subject ? `${liveMeetings[0].subject} · ` : ""}
                {liveMeetings[0].teacher_name}
              </p>
            </div>
          </div>
          {liveMeetings[0].join_url ? (
            <a
              href={liveMeetings[0].join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-sm"
            >
              <AppIcon name="Phone" size={16} />
              Join Now
            </a>
          ) : null}
        </div>
      ) : null}

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, subject or teacher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="relative sm:w-48 shrink-0">
          <AppIcon name="SlidersHorizontal" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full pl-10 pr-9 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-bold text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live Now</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Completed</option>
          </select>
          <AppIcon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── List body ─────────────────────────────────────────────────── */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : meetings.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <NoMatchesState onClear={() => {
          setSearch("");
          setStatusFilter("all");
        }} />
      ) : (
        <Timeline meetings={filtered} />
      )}
    </SchoolShell>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Timeline — vertical spine + dotted connectors, like the admin view
// ────────────────────────────────────────────────────────────────────────

function Timeline({ meetings }: { meetings: LiveClassItem[] }) {
  return (
    <div className="relative">
      <div className="absolute left-[22px] top-4 bottom-4 w-px bg-slate-200 hidden md:block" />
      <div className="space-y-3 relative z-10">
        {meetings.map((m) => (
          <div key={m._id} className="relative flex items-stretch gap-3 md:gap-4">
            {/* Timeline dot — desktop only */}
            <div className="hidden md:flex mt-5 h-12 w-12 shrink-0 items-center justify-center">
              <div
                className={`h-3 w-3 rounded-full border-2 ring-4 ring-slate-50 ${
                  m.status === "live"
                    ? "bg-rose-500 border-rose-500 animate-pulse"
                    : m.status === "upcoming"
                      ? "bg-white border-blue-500"
                      : "bg-white border-emerald-500"
                }`}
              />
            </div>
            <MeetingRow meeting={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Meeting row card — compact, premium-card style
// ────────────────────────────────────────────────────────────────────────

function MeetingRow({ meeting }: { meeting: LiveClassItem }) {
  const startTime = new Date(meeting.starts_at);
  const endTime = new Date(meeting.ends_at);

  const accent =
    meeting.status === "live"
      ? { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" }
      : meeting.status === "upcoming"
        ? { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" }
        : { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" };

  return (
    <div className="flex-1 premium-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent.bg} ${accent.text} border ${accent.border}`}
        >
          <AppIcon name="Video" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[13px] font-black text-slate-900 truncate">
              {meeting.title}
            </span>
            <StatusBadge status={meeting.status} />
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {meeting.subject ? (
              <>
                <span className="font-bold text-slate-700">{meeting.subject}</span>
                <span className="text-slate-300">·</span>
              </>
            ) : null}
            <span className="font-medium">{meeting.teacher_name}</span>
            <span className="text-slate-300">·</span>
            <span className="font-medium">
              {startTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="text-[10px] font-medium text-slate-400 mt-0.5">
            {startTime.toLocaleDateString([], {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            {meeting.class_name ? ` · ${meeting.class_name}` : ""}
            {meeting.provider ? ` · ${meeting.provider}` : ""}
          </div>
        </div>
      </div>

      <JoinAction meeting={meeting} />
    </div>
  );
}

function JoinAction({ meeting }: { meeting: LiveClassItem }) {
  if (meeting.status === "live" && meeting.join_url) {
    return (
      <a
        href={meeting.join_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-sm"
      >
        <AppIcon name="Phone" size={14} />
        Join
      </a>
    );
  }
  if (meeting.status === "upcoming") {
    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-100">
        <AppIcon name="Clock" size={14} />
        Scheduled
      </span>
    );
  }
  return (
    <span className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-400 text-[11px] font-bold">
      <AppIcon name="CheckCircle2" size={14} />
      Ended
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Status badge
// ────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LiveClassItem["status"] }) {
  const styles = {
    live: "bg-rose-50 text-rose-600 border-rose-100",
    upcoming: "bg-blue-50 text-blue-600 border-blue-100",
    ended: "bg-slate-50 text-slate-400 border-slate-100",
  } as const;
  const labels = { live: "Live", upcoming: "Upcoming", ended: "Ended" } as const;

  return (
    <span
      className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border inline-flex items-center ${styles[status]}`}
    >
      {status === "live" ? (
        <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full mr-1 animate-pulse" />
      ) : null}
      {labels[status]}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// States
// ────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
        <AppIcon name="VideoOff" size={24} className="text-slate-300" />
      </div>
      <p className="text-[13px] font-black text-slate-700">No live classes scheduled</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
        Live classes for this student will appear here as soon as a teacher
        schedules a session.
      </p>
    </div>
  );
}

function NoMatchesState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center flex flex-col items-center">
      <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
        <AppIcon name="SearchX" size={22} className="text-slate-300" />
      </div>
      <p className="text-[12px] font-black text-slate-700">No matches</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
        No sessions match your search and filter. Try clearing them.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="premium-card p-3.5 flex items-center gap-3 animate-pulse"
        >
          <div className="h-10 w-10 bg-slate-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 bg-slate-100 rounded" />
            <div className="h-2.5 w-56 bg-slate-50 rounded" />
            <div className="h-2 w-32 bg-slate-50 rounded" />
          </div>
          <div className="h-9 w-20 bg-slate-100 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
