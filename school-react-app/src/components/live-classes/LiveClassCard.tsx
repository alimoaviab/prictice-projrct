import React, { useMemo } from "react";
import { AppIcon } from "shared/ui/AppIcon";

interface LiveClassCardProps {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  meetingLink?: string;
  role: "TEACHER" | "STUDENT" | "ADMIN";
  onJoin?: (id: string, link: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
}

export const LiveClassCard: React.FC<LiveClassCardProps> = ({
  id,
  title,
  startTime,
  endTime,
  subjectName,
  teacherName,
  status,
  meetingLink,
  role,
  onJoin,
  onUpdateStatus,
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  const timeString = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // Calculate duration in minutes
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  // Determine if it's starting soon (within 15 minutes)
  const isStartingSoon = status === "SCHEDULED" && start.getTime() - now.getTime() < 15 * 60000 && start.getTime() > now.getTime();

  const displayStatus = isStartingSoon ? "STARTING SOON" : status;

  const statusConfig = {
    SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: <AppIcon name="Calendar" className="w-3.5 h-3.5 mr-1" /> },
    "STARTING SOON": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AppIcon name="Clock" className="w-3.5 h-3.5 mr-1" /> },
    LIVE: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <span className="relative flex h-2 w-2 mr-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span> },
    COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <AppIcon name="CheckCircle" className="w-3.5 h-3.5 mr-1" /> },
    CANCELLED: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: <AppIcon name="XCircle" className="w-3.5 h-3.5 mr-1" /> },
  };

  const currentConfig = statusConfig[displayStatus as keyof typeof statusConfig];

  // Mock attendance
  const mockAttendance = useMemo(() => Math.floor(Math.random() * 20) + 15, []);

  return (
    <div className={`group relative rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-md ${displayStatus === 'LIVE' ? 'border-red-200 shadow-sm shadow-red-100/50' : 'border-slate-200'}`}>

      {/* Top Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3 items-center">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
             <AppIcon name="User" className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold  normal-case border ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border}`}>
                {currentConfig.icon}
                {displayStatus}
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{subjectName}</span>
            </div>
            <h3 className="mt-1 text-base font-bold text-slate-900 leading-tight">{title}</h3>
          </div>
        </div>
      </div>

      {/* Grid Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center text-slate-500">
            <AppIcon name="Clock" className="mr-1.5 h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-900">{timeString}</span>
          </div>
          <div className="text-slate-500 pl-5.5 text-xs">{durationMinutes} min • {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}</div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center text-slate-500">
            <AppIcon name="User" className="mr-1.5 h-4 w-4 text-slate-400" />
            <span className="truncate max-w-[120px] font-medium text-slate-900" title={teacherName || "Teacher"}>{teacherName || "Teacher"}</span>
          </div>
          {displayStatus === 'LIVE' && (
            <div className="flex items-center text-slate-500 pl-5.5 text-xs">
              <AppIcon name="Users" className="mr-1 h-3 w-3" />
              {mockAttendance} attending
            </div>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
        {(status === "SCHEDULED" || status === "LIVE") ? (
          <button
            onClick={() => meetingLink && onJoin && onJoin(id, meetingLink)}
            disabled={!meetingLink}
            className={`flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              meetingLink
                ? status === "LIVE"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                  : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {meetingLink ? <><AppIcon name="Video" className="w-4 h-4 mr-2" /> Join Session</> : "No Link"}
          </button>
        ) : (
           <div className="flex-1 px-4 py-2 text-sm font-medium text-slate-500 text-center bg-slate-50 rounded-xl border border-slate-100">
             Session {status.toLowerCase()}
           </div>
        )}

        {role === "TEACHER" && status === "SCHEDULED" && onUpdateStatus && (
          <button
            onClick={() => onUpdateStatus(id, "LIVE")}
            className="inline-flex items-center justify-center rounded-xl bg-red-50 text-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-100 border border-red-200 transition-colors"
          >
            <AppIcon name="Play" className="w-4 h-4 mr-1.5" /> Start
          </button>
        )}

        {role === "TEACHER" && status === "LIVE" && onUpdateStatus && (
          <button
            onClick={() => onUpdateStatus(id, "COMPLETED")}
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            End
          </button>
        )}
      </div>

    </div>
  );
};
