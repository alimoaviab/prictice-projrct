import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton, Button } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";

type TeacherPortalResponse = {
  teacher: {
    id: string;
    employee_no: string;
    first_name: string;
    last_name: string;
    email: string;
    qualification: string;
    status: string;
  };
  school: {
    name: string;
    session: string;
  };
  alerts: Array<{
    type: string;
    priority: "blue" | "orange" | "red" | "green";
    title: string;
    message: string;
    action: string;
  }>;
  operationalStats: {
    todayAttendance: { total: number; marked: number };
    pendingGrading: number;
    homeworkStatus: { pending: number };
  };
  classes: Array<{
    id: string;
    name: string;
    section: string;
    studentCount: number;
    pendingHomework: number;
    upcomingExams: number;
    academicYear: string;
  }>;
  todaySchedule: Array<{
    id: string;
    start_time: string;
    end_time: string;
    class_name: string;
    subject_name: string;
    room: string;
    attendance_marked: boolean;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    message: string;
    date: string;
  }>;
};

export function TeacherDashboardPage() {
  const { user } = useAuth();
  const { state, run } = useSafeAsync<TeacherPortalResponse>();

  const fetchDashboard = () => {
    void run(async () => {
      const result = await serviceRequest<TeacherPortalResponse>(`/api/teachers/${user?.profileId || "session"}`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load dashboard");
      return result.data;
    }).catch(() => { });
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.profileId]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <SchoolShell eyebrow="Teacher Portal" title="Workspace">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Error" title="Teacher Workspace">
        <DataState variant="error" title="Dashboard Unavailable" message={state.error} />
      </SchoolShell>
    );
  }

  // The API returns the teacher object directly from GET /api/teachers/session.
  // Handle both shapes: direct teacher object OR nested portal response.
  const raw = state.data as any;
  const teacher = raw?.teacher || raw;
  const school = raw?.school || { name: "", session: "" };
  const alerts = raw?.alerts || [];
  const operationalStats = raw?.operationalStats || raw?.stats || {};
  const classes = raw?.classes || [];
  const todaySchedule = raw?.todaySchedule || [];
  const announcements = raw?.announcements || [];

  if (!teacher?.first_name) {
    return (
      <SchoolShell eyebrow="Error" title="Teacher Workspace">
        <DataState variant="error" title="Profile Incomplete" message="Your teacher profile could not be loaded. Please contact your administrator." />
      </SchoolShell>
    );
  }

  const teacherName = `${teacher.first_name} ${teacher.last_name || ""}`.trim();
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <SchoolShell eyebrow="Dashboard" title="Teacher Workspace">
      <div className="space-y-5 pb-10">
        {/* COMPACT HEADER */}
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {teacher.first_name?.[0] || "T"}{teacher.last_name?.[0] || ""}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{teacherName}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID: {teacher.employee_no || "—"}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{todayDate}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AY: {school?.session || "—"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{school?.name || ""}</p>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[9px] font-black uppercase py-0.5 px-1.5 bg-blue-50 text-blue-700 border-blue-100">{teacher?.status || "active"}</Badge>
              <span className="text-[10px] font-medium text-slate-400">Active Session</span>
            </div>
          </div>
        </section>

        {/* SMART ALERTS ROW */}
        {alerts.length > 0 && (
          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {alerts.map((alert: any, idx: number) => (
              <AlertCard key={idx} {...alert} />
            ))}
          </section>
        )}

        {/* OPERATIONAL STATS */}
        <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <OpStatCard 
            label="Today Attendance" 
            value={`${operationalStats.todayAttendance?.marked ?? 0}/${operationalStats.todayAttendance?.total ?? 0}`}
            sublabel={(operationalStats.todayAttendance?.total ?? 0) === (operationalStats.todayAttendance?.marked ?? 0) ? "All Marked" : "Pending Action"}
            icon={<AppIcon name="CheckCircle" className="h-4 w-4" />}
            status={(operationalStats.todayAttendance?.total ?? 0) === (operationalStats.todayAttendance?.marked ?? 0) ? "success" : "warning"}
          />
          <OpStatCard 
            label="Pending Results" 
            value={operationalStats.pendingGrading ?? 0}
            sublabel="Exams to Grade"
            icon={<AppIcon name="FileText" className="h-4 w-4" />}
            status={(operationalStats.pendingGrading ?? 0) > 0 ? "danger" : "success"}
          />
          <OpStatCard 
            label="Homework" 
            value={operationalStats.homeworkStatus?.pending ?? 0}
            sublabel="Reviews Pending"
            icon={<AppIcon name="BookOpen" className="h-4 w-4" />}
            status={(operationalStats.homeworkStatus?.pending ?? 0) > 0 ? "warning" : "success"}
          />
          <OpStatCard 
            label="Live Sessions" 
            value={todaySchedule.length}
            sublabel="Scheduled Today"
            icon={<AppIcon name="Video" className="h-4 w-4" />}
            status="info"
          />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* MAIN COLUMN */}
          <div className="space-y-5">
            {/* TODAY WORKSPACE */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Today's Workspace</h3>
                <Link to="/teacher/timetable" className="text-[10px] font-bold text-blue-600 hover:underline">View Full Schedule</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {todaySchedule.length > 0 ? todaySchedule.map((task: any) => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-slate-600 uppercase leading-none">{(task.start_time || "00:00").split(':')[0]}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{(task.start_time || "00:00").split(':')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{task.subject_name || "Unknown Subject"} — {task.class_name || "Unknown Class"}</p>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Room {task.room || "—"} • {task.start_time || "—"} - {task.end_time || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!task.attendance_marked ? (
                        <Button size="sm" variant="primary" className="h-7 px-3 text-[10px] font-bold rounded-lg">
                          <Link to={`/teacher/attendance/create?class=${task.id}`}>Mark Attendance</Link>
                        </Button>
                      ) : (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] py-1">Attendance Marked</Badge>
                      )}
                      <Button size="sm" variant="secondary" className="h-7 w-7 p-0 rounded-lg border-slate-200">
                        <AppIcon name="ArrowUpRight" className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                      <AppIcon name="Calendar" className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">No classes scheduled for today.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Enjoy your free time or prepare for upcoming sessions.</p>
                  </div>
                )}
              </div>
            </section>

            {/* CLASSES SNAPSHOT */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Assigned Classes</h3>
                <Link to="/teacher/classes" className="text-[10px] font-bold text-blue-600 hover:underline">Manage All</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {classes.map((cls: any) => (
                  <ClassCard key={cls.id} {...cls} />
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR COLUMN */}
          <div className="space-y-5">
            {/* TIMELINE PANEL */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                  <AppIcon name="Clock3" className="h-3.5 w-3.5 text-blue-500" />
                  Academic Timeline
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {todaySchedule.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="relative pl-5 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-slate-200 last:before:hidden">
                    <div className="absolute left-[-3px] top-1 h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.1)]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{item.start_time}</p>
                    <p className="mt-1 text-xs font-bold text-slate-900">{item.subject_name}</p>
                    <p className="text-[10px] font-medium text-slate-500">{item.class_name}</p>
                  </div>
                ))}
                {todaySchedule.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-400 italic text-center py-4">Timeline empty for today</p>
                )}
              </div>
            </section>

            {/* NOTICES PANEL */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                  <AppIcon name="Bell" className="h-3.5 w-3.5 text-orange-500" />
                  Notices
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {announcements.length > 0 ? announcements.map((a: any) => (
                  <div key={a.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{a.title}</h4>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{a.message}</p>
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-slate-400 italic">No operational notices</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}

function AlertCard({ priority, title, message, action }: { 
  type?: string; 
  priority: "blue" | "orange" | "red" | "green"; 
  title: string; 
  message: string; 
  action: string; 
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-900",
    orange: "bg-orange-50 border-orange-100 text-orange-900",
    red: "bg-red-50 border-red-100 text-red-900",
    green: "bg-emerald-50 border-emerald-100 text-emerald-900"
  };

  const iconColors = {
    blue: "text-blue-600",
    orange: "text-orange-600",
    red: "text-red-600",
    green: "text-emerald-600"
  };

  return (
    <div className={`p-3 border rounded-xl flex items-start gap-3 shadow-sm ${colors[priority]}`}>
      <div className={`mt-0.5 ${iconColors[priority]}`}>
        <AppIcon name="AlertCircle" className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-1">{title}</p>
        <p className="text-[10px] font-medium opacity-80 leading-tight mb-2">{message}</p>
        <Link to={action} className="text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
          Fix Now <AppIcon name="ChevronRight" className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  );
}

function OpStatCard({ label, value, sublabel, icon, status }: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: React.ReactNode;
  status: "success" | "warning" | "danger" | "info";
}) {
  const statusColors = {
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-orange-600 bg-orange-50",
    danger: "text-red-600 bg-red-50",
    info: "text-blue-600 bg-blue-50"
  };

  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusColors[status]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">{label}</p>
        <p className="text-xl font-black text-slate-900 mt-1 tracking-tight leading-none">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{sublabel}</p>
      </div>
    </div>
  );
}

function ClassCard({ id, name, section, studentCount, pendingHomework, upcomingExams }: any) {
  return (
    <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <AppIcon name="Users" className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{name} - {section}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{studentCount} Students Enrolled</p>
            </div>
          </div>
          <Link to={`/teacher/classes/${id}`}>
            <AppIcon name="ArrowUpRight" className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Homework</p>
            <p className={`text-xs font-bold mt-0.5 ${pendingHomework > 0 ? "text-orange-600" : "text-slate-600"}`}>
              {pendingHomework > 0 ? `${pendingHomework} Pending` : "Complete"}
            </p>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Exams</p>
            <p className="text-xs font-bold mt-0.5 text-slate-600">
              {upcomingExams > 0 ? `${upcomingExams} Upcoming` : "None"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="px-2 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-1">
        {[
          ["Attendance", "fact_check", `/teacher/attendance/create?class_id=${id}`],
          ["Results", "leaderboard", `/teacher/results/create?class_id=${id}`],
          ["Homework", "assignment", `/teacher/homework/create?class_id=${id}`],
          ["Message", "mail", `/teacher/messages?class_id=${id}`]
        ].map(([label, icon, href]) => (
          <Link 
            key={label} 
            to={href}
            className="flex-1 flex flex-col items-center gap-1 py-1 rounded hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-blue-600"
          >
            <AppIcon name={icon} size={14} />
            <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
