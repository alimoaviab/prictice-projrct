/**
 * Parent Live Classes Page — shows Google Meet / live class sessions
 * filtered by the selected child's class.
 */

import { useQuery } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { SchoolShell } from "@/layouts/SchoolShell";

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

export function ParentLiveClassesPage() {
  const { selectedChild } = useSelectedChild();
  const studentId = selectedChild?.student_id || "";

  const { data: meetings = [], isLoading } = useQuery<LiveClassItem[]>({
    queryKey: ["parent-live-classes", studentId],
    queryFn: async () => {
      const params = studentId ? `?student_id=${studentId}` : "";
      const res = await serviceRequest<LiveClassItem[]>(`/api/parent/live-classes${params}`);
      if (!res.ok) throw new Error(res.error?.message || "Failed to load");
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const liveMeetings = meetings.filter((m) => m.status === "live");
  const upcomingMeetings = meetings.filter((m) => m.status === "upcoming");
  const endedMeetings = meetings.filter((m) => m.status === "ended");

  return (
    <SchoolShell title="Live Classes" eyebrow="ACADEMIC">
      <div className="space-y-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {liveMeetings.length > 0 && (
              <Section title="🔴 Live Now" count={liveMeetings.length}>
                {liveMeetings.map((m) => (
                  <MeetingCard key={m._id} meeting={m} />
                ))}
              </Section>
            )}
            {upcomingMeetings.length > 0 && (
              <Section title="📅 Upcoming" count={upcomingMeetings.length}>
                {upcomingMeetings.map((m) => (
                  <MeetingCard key={m._id} meeting={m} />
                ))}
              </Section>
            )}
            {endedMeetings.length > 0 && (
              <Section title="✅ Completed" count={endedMeetings.length}>
                {endedMeetings.slice(0, 5).map((m) => (
                  <MeetingCard key={m._id} meeting={m} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </SchoolShell>
  );
}

// ─── Meeting Card ────────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: LiveClassItem }) {
  const startTime = new Date(meeting.starts_at);
  const endTime = new Date(meeting.ends_at);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          meeting.status === "live" ? "bg-red-50 text-red-600" :
          meeting.status === "upcoming" ? "bg-blue-50 text-blue-600" :
          "bg-slate-50 text-slate-400"
        }`}>
          <span className="material-symbols-outlined text-[18px]">videocam</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-900 truncate">{meeting.title}</span>
            <StatusBadge status={meeting.status} />
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {meeting.subject && <span>{meeting.subject} • </span>}
            <span>{meeting.teacher_name}</span>
            <span className="mx-1">•</span>
            <span>{startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {startTime.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
            {meeting.class_name && ` • ${meeting.class_name}`}
          </div>
        </div>
      </div>

      {/* Join Button */}
      {meeting.status === "live" && meeting.join_url ? (
        <a
          href={meeting.join_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-3 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">call</span>
          Join
        </a>
      ) : meeting.status === "upcoming" ? (
        <span className="shrink-0 px-3 py-1.5 bg-slate-50 text-slate-400 text-[11px] font-bold rounded-lg border border-slate-100">
          Scheduled
        </span>
      ) : (
        <span className="shrink-0 px-3 py-1.5 text-slate-300 text-[11px] font-bold">
          Ended
        </span>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-red-50 text-red-600 border-red-100",
    upcoming: "bg-blue-50 text-blue-600 border-blue-100",
    ended: "bg-slate-50 text-slate-400 border-slate-100",
  };
  const labels = { live: "Live", upcoming: "Upcoming", ended: "Ended" };

  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${styles[status as keyof typeof styles] || styles.ended}`}>
      {status === "live" && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse" />}
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-slate-300 text-[24px]">videocam_off</span>
      </div>
      <p className="text-sm font-bold text-slate-500">No live classes scheduled</p>
      <p className="text-xs text-slate-400 mt-1">Live classes for this student will appear here.</p>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 animate-pulse">
          <div className="w-9 h-9 bg-slate-100 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 bg-slate-100 rounded" />
            <div className="h-2.5 w-56 bg-slate-50 rounded" />
          </div>
          <div className="h-7 w-16 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
