import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  CalendarDays,
  Search,
  Filter,
  RefreshCcw,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useTimetable } from "@/modules/timetable/hooks/useTimetable";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { 
  Card, 
  Badge, 
  Button, 
  Skeleton, 
  DataState, 
  Input, 
  Select 
} from "@/components/ui";
import { getDayLabel, TimetableRecord } from "@/modules/timetable/types/timetable.types";
import { serviceRequest } from "@/services/service-client";

type ViewMode = "weekly" | "agenda" | "today";

interface TeacherClass {
  id: string;
  name: string;
  section: string;
  studentCount: number;
}

export function TeacherTimetablePage() {
  const { user } = useAuth();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [academicYears, setAcademicYears] = useState<Array<{label: string, value: string}>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [filters, setFilters] = useState({
    academicYear: "",
    day: "all"
  });

  // Fetch teacher's assigned classes
  const { state: classesState, run: runClasses } = useSafeAsync<TeacherClass[]>();

  useEffect(() => {
    if (!user?.profileId) return;
    void runClasses(async () => {
      const result = await serviceRequest<any>(`/api/teachers/${user.profileId}`);
      if (!result.ok) throw new Error(result.error?.message || "Failed to load classes");
      const data = result.data as any;
      const classes = data?.classes || [];
      return classes;
    });
  }, [user?.profileId, runClasses]);

  // Build timetable query - fetch for all assigned classes or selected class
  const timetableQuery = useMemo(() => {
    if (!classesState.data || classesState.data.length === 0) return undefined;
    
    // If a specific class is selected, fetch only that class's timetable
    if (selectedClassId !== "all") {
      return { class_id: selectedClassId };
    }
    
    // Otherwise, we'll fetch all classes' timetables
    return undefined;
  }, [classesState.data, selectedClassId]);

  const { state: timetableState, refresh } = useTimetable(timetableQuery);

  // Fetch all class timetables if no specific class selected
  const { state: allTimetablesState, run: runAllTimetables } = useSafeAsync<TimetableRecord[]>();

  const fetchAllTimetables = useCallback(async () => {
    if (!classesState.data) return [];
    const allRecords: TimetableRecord[] = [];
    for (const cls of classesState.data) {
      const result = await serviceRequest<TimetableRecord[]>(`/api/timetable?class_id=${cls.id}`);
      if (result.ok && result.data) {
        allRecords.push(...(Array.isArray(result.data) ? result.data : []));
      }
    }
    return allRecords;
  }, [classesState.data]);

  useEffect(() => {
    if (selectedClassId !== "all" || !classesState.data || classesState.data.length === 0) return;
    
    void runAllTimetables(fetchAllTimetables);
  }, [selectedClassId, classesState.data, runAllTimetables, fetchAllTimetables]);

  // Fetch Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const result = await serviceRequest<{ items?: Array<{ _id?: string; id?: string; year?: string; name?: string }> } | Array<{ _id?: string; id?: string; year?: string; name?: string }>>("/api/academic-years");
        if (result.ok) {
          const rows = Array.isArray(result.data)
            ? result.data
            : Array.isArray(result.data?.items)
              ? result.data.items
              : [];
          const years = rows
            .map((y) => ({
              label: y.year || y.name || "Academic Year",
              value: y._id || y.id || ""
            }))
            .filter((y) => y.value);

          setAcademicYears(years);
          if (years.length > 0 && !filters.academicYear) {
            setFilters(prev => ({ ...prev, academicYear: years.find(y => y.label.includes("2024"))?.value || years[0].value }));
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchYears();
  }, []);

  // Determine which timetable data to use
  const timetableData = selectedClassId !== "all" ? timetableState.data : allTimetablesState.data;
  const isLoading = selectedClassId !== "all" ? timetableState.status === "loading" : allTimetablesState.status === "loading";

  // Timetable Calculations
  const processedData = useMemo(() => {
    if (!timetableData) return [];
    return timetableData.filter(item => {
      const matchesSearch = item.class_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.room?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDay = filters.day === "all" || String(item.day_of_week) === filters.day;
      
      return matchesSearch && matchesDay;
    });
  }, [timetableData, searchQuery, filters]);

  // Derived Stats
  const stats = useMemo(() => {
    const today = new Date().getDay(); // 0 is Sunday
    const todayNum = today === 0 ? 7 : today;
    const todayClasses = processedData.filter(item => item.day_of_week === todayNum);
    
    return {
      todayCount: todayClasses.length,
      weeklyCount: processedData.length,
      uniqueSubjects: new Set(processedData.map(i => i.subject_id)).size,
      uniqueClasses: new Set(processedData.map(i => i.class_id)).size
    };
  }, [processedData]);

  // Current/Next Class Logic
  const liveSchedule = useMemo(() => {
    if (!timetableData) return null;
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.getDay() === 0 ? 7 : now.getDay();

    const todaySchedule = timetableData
      .filter(item => item.day_of_week === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const current = todaySchedule.find(item => item.start_time <= currentTime && item.end_time >= currentTime);
    const next = todaySchedule.find(item => item.start_time > currentTime);

    return { current, next };
  }, [timetableData]);

  if (isLoading || classesState.status === "loading") {
    return (
      <SchoolShell eyebrow="TEACHER HUB" title="Timetable Matrix">
        <div className="space-y-6">
          <Skeleton className="h-56 w-full rounded-[2rem]" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-[500px] w-full rounded-[2rem]" />
        </div>
      </SchoolShell>
    );
  }

  if (classesState.status === "error") {
    return (
      <SchoolShell eyebrow="TEACHER HUB" title="Timetable Matrix">
        <DataState variant="error" title="Failed to Load Classes" message={classesState.error} />
      </SchoolShell>
    );
  }

  const assignedClasses = classesState.data || [];
  const classOptions = [
    { label: "All Classes", value: "all" },
    ...assignedClasses.map(c => ({ label: `${c.name} ${c.section}`, value: c.id }))
  ];

  return (
    <SchoolShell eyebrow="TEACHER ANALYTICS" title="Academic Schedule">
      <div className="space-y-4 pb-10 max-w-[1400px] mx-auto px-4">
        
        {/* Modern Live Status Banner - Compact */}
        <section className="grid lg:grid-cols-12 gap-4 items-stretch">
          <div className="lg:col-span-9 h-full">
            <LiveClassWidget live={liveSchedule} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-3 h-full">
            <StatSmallCard label="Today" value={stats.todayCount} sub="Classes" icon="calendar_today" color="text-blue-600" bg="bg-blue-600/5" />
            <StatSmallCard label="Weekly" value={stats.weeklyCount} sub="Periods" icon="schedule" color="text-indigo-600" bg="bg-indigo-600/5" />
            <StatSmallCard label="Subjects" value={stats.uniqueSubjects} sub="Assigned" icon="menu_book" color="text-emerald-600" bg="bg-emerald-600/5" />
            <StatSmallCard label="Classes" value={assignedClasses.length} sub="Assigned" icon="groups" color="text-purple-600" bg="bg-purple-600/5" />
          </div>
        </section>

        {/* Unified Filters Toolbar - Ultra Compact Sticky */}
        <div className="sticky top-[68px] z-[30]">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/60 shadow-lg shadow-slate-200/20 rounded-xl p-1.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-2 max-w-xl">
              <div className="relative flex-1 group">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400 group-focus-within:text-blue-600 transition-colors">search</span>
                <input 
                  placeholder="Quick Search..." 
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white/50 pl-9 pr-2 text-[11px] font-bold text-slate-700 outline-none transition-all focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <Select 
                options={classOptions} 
                value={selectedClassId} 
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="border-0 bg-transparent h-8 text-[9px] font-black text-slate-900 uppercase tracking-widest min-w-[140px]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex bg-slate-100/50 p-0.5 rounded-lg border border-slate-200/60">
                <ViewToggle active={viewMode === "weekly"} onClick={() => setViewMode("weekly")} icon="grid_view" label="Grid" />
                <ViewToggle active={viewMode === "agenda"} onClick={() => setViewMode("agenda")} icon="view_agenda" label="Agenda" />
                <ViewToggle active={viewMode === "today"} onClick={() => setViewMode("today")} icon="event_note" label="Today" />
              </div>
              <div className="h-4 w-px bg-slate-200 mx-0.5" />
              <Button variant="secondary" className="h-8 rounded-lg px-3 border-slate-200 font-black text-[9px] uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all">
                <span className="material-symbols-outlined text-base mr-1.5">tune</span>
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Main Workspace Area */}
        <AnimatePresence mode="wait">
          {processedData.length > 0 ? (
            <motion.div 
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "weekly" && <WeeklyGridView data={processedData} />}
              {viewMode === "agenda" && <AgendaView data={processedData} />}
              {viewMode === "today" && <TodayView data={processedData} />}
            </motion.div>
          ) : (
            <EmptyScheduleState onRefresh={() => {
              if (selectedClassId !== "all") {
                refresh();
              } else {
                void runAllTimetables(fetchAllTimetables);
              }
            }} />
          )}
        </AnimatePresence>
      </div>
    </SchoolShell>
  );
}

function LiveClassWidget({ live }: { live: { current?: TimetableRecord, next?: TimetableRecord } | null }) {
  return (
    <Card className="h-full border-0 bg-[#1D4ED8] relative overflow-hidden rounded-[1.5rem] text-white shadow-xl shadow-blue-600/20 group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 animate-gradient-x opacity-95" />
      <div className="absolute top-[-40%] right-[-10%] h-64 w-64 rounded-full bg-white/5 blur-[80px]" />
      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70">
              {live?.current ? "Live" : "Upcoming"}
            </span>
          </div>
          
          <AnimatePresence mode="wait">
            {live?.current ? (
              <motion.div key="current" className="space-y-3">
                <h2 className="text-2xl font-black tracking-tight leading-none">{live.current.subject_name}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                    <span className="material-symbols-outlined text-sm">groups</span> {live.current.class_name} {live.current.section}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">
                    <span className="material-symbols-outlined text-sm">meeting_room</span> Room {live.current.room}
                  </div>
                </div>
              </motion.div>
            ) : live?.next ? (
              <motion.div key="next" className="space-y-2">
                <h2 className="text-xl font-black tracking-tight text-white/90">{live.next.subject_name}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">
                  <span className="material-symbols-outlined text-sm">timer</span> Starts {live.next.start_time}
                </div>
              </motion.div>
            ) : (
              <h2 className="text-xl font-black tracking-tight text-white/30 italic py-4">No sessions active</h2>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex -space-x-2">
             {[1,2,3].map(i => (
               <div key={i} className="h-7 w-7 rounded-full border-2 border-blue-700 bg-blue-500/50 flex items-center justify-center overflow-hidden">
                  <span className="material-symbols-outlined text-xs text-white/40">person</span>
               </div>
             ))}
          </div>
          
          <button className="group/btn relative inline-flex items-center gap-2 px-4 h-9 bg-white rounded-lg text-blue-700 transition-all hover:pr-6 active:scale-95 text-[10px] font-black uppercase tracking-widest">
            <span>Attendance</span>
            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

function WeeklyGridView({ data }: { data: TimetableRecord[] }) {
  const days = [1, 2, 3, 4, 5, 6];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/30 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[100px_repeat(6,1fr)] bg-slate-50/50 border-b border-slate-100">
            <div className="p-3"></div>
            {days.map(d => (
              <div key={d} className="p-3 text-center border-l border-slate-100/50">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">{getDayLabel(d)}</span>
                <span className="text-[10px] font-black text-slate-900 tracking-tight">Cycle {d}</span>
              </div>
            ))}
          </div>

          <div className="relative">
            {timeSlots.map((time, idx) => (
              <div key={time} className="grid grid-cols-[100px_repeat(6,1fr)] border-b border-slate-50 last:border-0 group/row">
                <div className="p-4 text-right border-r border-slate-100 bg-slate-50/20 group-hover/row:bg-blue-50/20 transition-colors">
                  <span className="text-[10px] font-black text-slate-900 tracking-tighter block leading-none">{time}</span>
                  <span className="text-[8px] font-black text-slate-400 mt-0.5 uppercase">P{idx + 1}</span>
                </div>
                {days.map(day => {
                  const items = data.filter(i => i.day_of_week === day && i.start_time.startsWith(time.split(":")[0]));
                  return (
                    <div key={day} className="p-1 border-r border-slate-50 last:border-0 relative min-h-[90px] group/cell hover:bg-slate-50/40 transition-colors">
                      {items.map(item => (
                        <PeriodCard key={item._id} item={item} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PeriodCard({ item }: { item: TimetableRecord }) {
  const getSubjectStyles = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("math")) return "bg-blue-500/5 border-blue-500/20 text-blue-700";
    if (n.includes("sci") || n.includes("phy") || n.includes("che") || n.includes("bio")) return "bg-emerald-500/5 border-emerald-500/20 text-emerald-700";
    if (n.includes("eng")) return "bg-amber-500/5 border-amber-500/20 text-amber-700";
    if (n.includes("comp") || n.includes("it")) return "bg-purple-500/5 border-purple-500/20 text-purple-700";
    return "bg-slate-500/5 border-slate-500/20 text-slate-700";
  };

  const style = getSubjectStyles(item.subject_name);

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.02 }}
      className={`absolute inset-1 p-2 rounded-xl border ${style} flex flex-col justify-between shadow-sm hover:shadow-lg transition-all group cursor-pointer overflow-hidden backdrop-blur-[1px]`}
    >
      <div className="absolute top-0 right-0 p-1 opacity-5">
        <span className="material-symbols-outlined text-2xl">calendar_today</span>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] font-black tracking-tighter opacity-70">
            {item.start_time}
          </span>
          <span className="material-symbols-outlined text-[10px] opacity-0 group-hover:opacity-100 transition-all">more_vert</span>
        </div>
        <h4 className="text-[10px] font-black tracking-tight leading-tight truncate">{item.subject_name}</h4>
        <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest">{item.class_name} {item.section}</p>
      </div>

      <div className="mt-auto pt-1.5 border-t border-current/5 flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[11px]">meeting_room</span>
          <span className="text-[8px] font-black uppercase">R{item.room}</span>
        </div>
      </div>
    </motion.div>
  );
}

function AgendaView({ data }: { data: TimetableRecord[] }) {
  const grouped = useMemo(() => {
    const res: Record<number, TimetableRecord[]> = {};
    data.forEach(item => {
      if (!res[item.day_of_week]) res[item.day_of_week] = [];
      res[item.day_of_week].push(item);
    });
    return Object.entries(res).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [data]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {grouped.map(([day, items]) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center">
               <span className="text-[11px] font-black text-blue-600">{day}</span>
            </div>
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              {getDayLabel(Number(day))}
            </h3>
            <div className="h-px flex-1 bg-slate-100" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(item => (
              <AgendaCard key={item._id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AgendaCard({ item }: { item: TimetableRecord }) {
  return (
    <Card className="p-4 border-slate-200/60 bg-white shadow-md rounded-2xl group hover:shadow-xl transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
             <span className="material-symbols-outlined text-xl">school</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1">{item.subject_name}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.class_name} • {item.section}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-900 block">{item.start_time}</span>
          <span className="text-[8px] font-black text-slate-400 uppercase">{item.end_time}</span>
        </div>
      </div>
    </Card>
  );
}

function TodayView({ data }: { data: TimetableRecord[] }) {
  const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const todayClasses = useMemo(() => {
    return data.filter(item => item.day_of_week === today).sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [data, today]);

  if (todayClasses.length === 0) {
    return <EmptyScheduleState onRefresh={() => {}} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-600/20">
            {todayClasses.length}
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Sessions</h3>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-0.5">{getDayLabel(today)} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
        {todayClasses.map((item, idx) => (
          <div key={item._id} className="relative pl-12 group">
            <div className="absolute left-[17px] top-4 h-2.5 w-2.5 rounded-full bg-white border-2 border-blue-600 shadow-sm z-10" />
            <Card className="p-4 border-slate-100 bg-white shadow-md rounded-[1.25rem] hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center font-black text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">{item.subject_name}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.class_name} {item.section}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 leading-none">{item.start_time}</p>
                    <p className="text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">R{item.room}</p>
                  </div>
                  <button className="h-10 px-5 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md">Initiate</button>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatSmallCard({ label, value, sub, icon, color, bg }: { label: string; value: number | string; sub: string; icon: string; color: string; bg: string }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-3 shadow-sm flex flex-col justify-between group hover:border-blue-400/30 transition-all">
      <div className={`h-8 w-8 rounded-xl ${bg} ${color} flex items-center justify-center shadow-sm`}>
        <span className="material-symbols-outlined text-lg">{icon}</span>
      </div>
      <div className="mt-3">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black tracking-tighter ${color}`}>{value}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase">{sub}</span>
        </div>
      </div>
    </div>
  );
}

function ViewToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${active ? "bg-white text-blue-600 shadow-sm font-black ring-1 ring-slate-200" : "text-slate-400 font-bold hover:text-slate-600"}`}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      <span className="text-[8px] uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

function EmptyScheduleState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-200/60 shadow-lg relative overflow-hidden"
    >
      <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
        <span className="material-symbols-outlined text-3xl text-slate-200">calendar_add_on</span>
      </div>
      <h3 className="text-xl font-black text-slate-900 tracking-tight">Ledger Empty</h3>
      <p className="text-slate-400 mt-2 font-bold max-w-xs text-center uppercase tracking-widest text-[9px] px-6">
        Scheduler has not yet published periods. Synchronize or contact support.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button onClick={onRefresh} className="flex items-center gap-2 px-6 h-12 bg-blue-600 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
          <span>Synchronize</span>
          <span className="material-symbols-outlined text-base animate-spin-slow">refresh</span>
        </button>
      </div>
    </motion.div>
  );
}
function MoreVertical(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
