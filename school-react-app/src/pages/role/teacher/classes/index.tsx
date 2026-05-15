import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Calendar, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical,
  X,
  RefreshCcw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Mail,
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Badge, 
  Card, 
  DataState, 
  Skeleton, 
  Button, 
  Input, 
  Select
} from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";

type StudentPreview = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  section: string;
  capacity: number;
  academic_year: string;
  enrolled_students: number;
  lectures_today: number;
  attendance_pending: boolean;
  upcoming_exams: number;
  pending_assignments: number;
  students_preview: StudentPreview[];
};

type TeacherClassesResponse = {
  teacher: { id: string; first_name: string; last_name: string; employee_no: string };
  classes: ClassItem[];
  stats: {
    totalClasses: number;
    totalStudents: number;
    pendingAttendance: number;
    todayLectures: number;
    upcomingExams: number;
  };
  school: { name: string; session: string };
};

export function TeacherClassesPage() {
  const { user } = useAuth();
  const { state, run } = useSafeAsync<TeacherClassesResponse>();
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    academicYear: "",
    section: "all"
  });

  const teacherId = useMemo(() => {
    const profileId = user?.profileId;
    return profileId && /^[a-fA-F0-9]{24}$/.test(profileId) ? profileId : "session";
  }, [user?.profileId]);

  const fetchClasses = () => {
    void run(async () => {
      const result = await serviceRequest<TeacherClassesResponse>(`/api/teachers/${teacherId}`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
      return result.data;
    });
  };

  useEffect(() => {
    fetchClasses();
  }, [teacherId]);

  const filteredClasses = useMemo(() => {
    if (!state.data?.classes) return [];
    return state.data.classes.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.section.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = !filters.academicYear || c.academic_year === filters.academicYear;
      const matchesSection = filters.section === "all" || c.section === filters.section;
      
      return matchesSearch && matchesYear && matchesSection;
    });
  }, [state.data?.classes, searchQuery, filters]);

  const sections = useMemo(() => {
    if (!state.data?.classes) return [];
    const unique = Array.from(new Set(state.data.classes.map(c => c.section)));
    return ["all", ...unique];
  }, [state.data?.classes]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <SchoolShell eyebrow="Teacher Portal" title="My Assigned Classes">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Error" title="My Classes">
        <DataState variant="error" title="Workspace Load Failed" message={state.error} />
        <div className="mt-4 flex justify-center">
          <Button onClick={fetchClasses} variant="secondary" className="gap-2">
            <RefreshCcw className="h-4 w-4" /> Retry Connection
          </Button>
        </div>
      </SchoolShell>
    );
  }

  const raw = state.data as any;
  const classes = raw?.classes || [];
  const stats = raw?.stats || {
    totalClasses: 0,
    totalStudents: 0,
    pendingAttendance: 0,
    todayLectures: 0,
    upcomingExams: 0
  };
  const school = raw?.school || { name: "", session: "" };

  return (
    <SchoolShell eyebrow="Academic Operations" title="My Classes">
      <div className="space-y-5 pb-10">
        {/* OPERATIONAL TOOLBAR */}
        <section className="bg-white border border-slate-200 p-2 rounded-xl shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Search by class, section or subject..." 
              className="pl-9 h-9 border-0 bg-slate-50 focus:bg-white text-xs font-medium rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select 
              options={[{label: "All Sections", value: "all"}, ...sections.filter(s => s !== "all").map(s => ({label: `Section ${s}`, value: s}))]} 
              value={filters.section}
              onChange={(e: any) => setFilters(p => ({ ...p, section: e.target.value }))}
              className="h-9 w-32 text-[10px] font-bold uppercase tracking-tight border-slate-200 bg-white"
            />
            <Select 
              options={[
                {label: "2023-24", value: "2023-24"},
                {label: "2024-25", value: "2024-25"},
                {label: "2025-26", value: "2025-26"}
              ]} 
              value={filters.academicYear || school.session}
              onChange={(e: any) => setFilters(p => ({ ...p, academicYear: e.target.value }))}
              className="h-9 w-28 text-[10px] font-bold uppercase tracking-tight border-slate-200 bg-white"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"}`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <Button onClick={fetchClasses} variant="secondary" className="h-9 w-9 p-0 rounded-lg border-slate-200">
            <RefreshCcw className="h-3.5 w-3.5 text-slate-500" />
          </Button>
        </section>

        {/* STATS OVERVIEW (COMPACT) */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatPill label="Total Classes" value={stats.totalClasses} icon={<BookOpen className="h-3 w-3" />} />
          <StatPill label="Enrolled Students" value={stats.totalStudents} icon={<Users className="h-3 w-3" />} />
          <StatPill label="Pending Attendance" value={stats.pendingAttendance} icon={<ClipboardCheck className="h-3 w-3" />} variant={stats.pendingAttendance > 0 ? "warning" : "success"} />
          <StatPill label="Today Lectures" value={stats.todayLectures} icon={<Clock className="h-3 w-3" />} />
          <StatPill label="Upcoming Exams" value={stats.upcomingExams} icon={<Calendar className="h-3 w-3" />} />
        </section>

        {/* MAIN CONTENT AREA */}
        {filteredClasses.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((cls) => (
                <ClassCard key={cls.id} classItem={cls} />
              ))}
            </div>
          ) : (
            <ListView tableData={filteredClasses} />
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-100">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No assigned classes found.</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] text-center font-medium">Try adjusting your academic year filter or search query.</p>
          </div>
        )}
      </div>
    </SchoolShell>
  );
}

function StatPill({ label, value, icon, variant = "info" }: { label: string; value: number; icon: any; variant?: "info" | "warning" | "success" }) {
  const styles = {
    info: "bg-blue-50 text-blue-700 border-blue-100",
    warning: "bg-orange-50 text-orange-700 border-orange-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100"
  };

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border shadow-sm ${styles[variant]}`}>
      <div className="h-7 w-7 rounded-lg bg-white/60 flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{label}</p>
        <p className="text-sm font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

function ClassCard({ classItem }: { classItem: ClassItem }) {
  return (
    <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm hover:border-blue-300 transition-all group flex flex-col h-[320px]">
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-50 bg-white">
        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">{classItem.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section {classItem.section}</span>
            <span className="h-1 w-1 rounded-full bg-slate-200" />
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{classItem.academic_year}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black py-0 px-1.5 h-4 uppercase">ACTIVE</Badge>
          <button className="h-6 w-6 rounded-md hover:bg-slate-50 flex items-center justify-center text-slate-400">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* OPERATIONAL PILLS */}
      <div className="p-4 flex-1 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <MetricPill label={`${classItem.enrolled_students} Students`} icon={<Users className="h-2.5 w-2.5" />} color="blue" />
          <MetricPill label={`${classItem.lectures_today} Lectures Today`} icon={<Clock className="h-2.5 w-2.5" />} color="indigo" />
          <MetricPill label={`${classItem.upcoming_exams} Upcoming Exams`} icon={<Calendar className="h-2.5 w-2.5" />} color="purple" />
          <MetricPill label={`${classItem.pending_assignments} Homework Pending`} icon={<FileText className="h-2.5 w-2.5" />} color="orange" />
        </div>

        {/* ATTENDANCE STATE */}
        <div className={`mt-4 p-3 rounded-lg border flex items-center justify-between transition-all ${classItem.attendance_pending ? "bg-orange-50/50 border-orange-100" : "bg-emerald-50/50 border-emerald-100"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${classItem.attendance_pending ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"}`}>
              {classItem.attendance_pending ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">Attendance Status</p>
              <p className={`text-[9px] font-bold mt-1 ${classItem.attendance_pending ? "text-orange-600" : "text-emerald-600"}`}>
                {classItem.attendance_pending ? "ATTENDANCE NOT SUBMITTED" : "COMPLETED FOR TODAY"}
              </p>
            </div>
          </div>
          {classItem.attendance_pending && (
            <Link to={`/teacher/attendance/create?class_id=${classItem.id}`}>
              <Button size="sm" className="h-7 text-[8px] font-black uppercase px-2 bg-orange-600 hover:bg-orange-700">SUBMIT</Button>
            </Link>
          )}
        </div>

        {/* STUDENT PREVIEW */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-50">
          <div className="flex -space-x-2">
            {(classItem.students_preview || []).map((s, i) => (
              <div key={s.id} className="h-6 w-6 rounded-md border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600 shadow-sm" title={s.name}>
                {s.name[0]}
              </div>
            ))}
            {classItem.enrolled_students > 5 && (
              <div className="h-6 w-6 rounded-md border-2 border-white bg-slate-900 flex items-center justify-center text-[7px] font-black text-white shadow-sm">
                +{classItem.enrolled_students - 5}
              </div>
            )}
          </div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Student Directory</p>
        </div>
      </div>

      {/* ACTION ROW */}
      <div className="px-2 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-1">
        {[
          ["Students", "groups", `/teacher/classes/${classItem.id}/students`],
          ["Attendance", "fact_check", `/teacher/attendance/create?class_id=${classItem.id}`],
          ["Timetable", "event_note", `/teacher/timetable?class_id=${classItem.id}`],
          ["Results", "leaderboard", `/teacher/results/create?class_id=${classItem.id}`],
          ["Homework", "assignment", `/teacher/homework/create?class_id=${classItem.id}`],
          ["Exams", "history_edu", `/teacher/exams?class_id=${classItem.id}`]
        ].map(([label, icon, href]) => (
          <Link 
            key={label} 
            to={href}
            className="flex-1 flex flex-col items-center gap-1 py-1 rounded hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-blue-600"
          >
            <span className="material-symbols-outlined text-[14px]">{icon}</span>
            <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function MetricPill({ label, icon, color }: { label: string; icon: any; color: string }) {
  const styles: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold ${styles[color]}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ListView({ tableData }: { tableData: ClassItem[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Class & Section</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Students</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Today Lectures</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Status</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Upcoming Exams</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Homework Pending</th>
              <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableData.map((cls) => (
              <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-slate-900">{cls.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Section {cls.section} • {cls.academic_year}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-700">{cls.enrolled_students}</span>
                    <Users className="h-3 w-3 text-slate-300" />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-100 font-black">{cls.lectures_today} Sessions</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${cls.attendance_pending ? "bg-orange-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${cls.attendance_pending ? "text-orange-600" : "text-emerald-600"}`}>
                      {cls.attendance_pending ? "Pending" : "Completed"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm font-bold text-slate-600">{cls.upcoming_exams}</td>
                <td className="px-5 py-4">
                  {cls.pending_assignments > 0 ? (
                    <Badge className="bg-orange-50 text-orange-700 border-orange-100 font-black">{cls.pending_assignments} Pending</Badge>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Clean</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/teacher/attendance/create?class_id=${cls.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 text-[9px] font-bold uppercase border-slate-200">Attend.</Button>
                    </Link>
                    <Link to={`/teacher/classes/${cls.id}`}>
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-lg border-slate-200">
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
