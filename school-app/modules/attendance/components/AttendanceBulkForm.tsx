"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { 
  Button, 
  DataState, 
  Input, 
  Select, 
  Skeleton,
  Badge
} from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { serviceRequest } from "../../../services/service-client";
import { listAttendance, markAttendance } from "../services/attendance.service";
import { AttendanceBulkInput, AttendanceStatus, AttendanceRecordRow } from "../types/attendance.types";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserX, 
  UserCheck, 
  Calendar,
  Users,
  Search,
  Check,
  X,
  History,
  FileText,
  ChevronRight
} from "lucide-react";

interface ClassOption {
    id: string;
    label: string;
    section: string;
    academicYearId?: string;
}

interface StudentOption {
    _id: string;
    first_name: string;
    last_name: string;
    admission_no: string;
    class_id: string;
    section?: string;
    roll_no?: string;
    photo?: string;
    status: "active" | "inactive" | "graduated" | "transferred";
}

interface AttendanceBulkFormProps {
    initialClassId?: string;
    onSaved?: () => void;
}

const statusOptions: Array<{ label: string; value: AttendanceStatus; icon: any; color: string; bg: string }> = [
    { label: "Present", value: "present", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Absent", value: "absent", icon: UserX, color: "text-red-600", bg: "bg-red-50" },
    { label: "Late", value: "late", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Excused", value: "excused", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" }
];

const periodOptions = [
  { label: "1st Period", value: "1" },
  { label: "2nd Period", value: "2" },
  { label: "3rd Period", value: "3" },
  { label: "4th Period", value: "4" },
  { label: "5th Period", value: "5" },
  { label: "6th Period", value: "6" },
  { label: "7th Period", value: "7" },
  { label: "8th Period", value: "8" },
];

function getToday() {
    return new Date().toISOString().split("T")[0];
}

export function AttendanceBulkForm({ initialClassId, onSaved }: AttendanceBulkFormProps) {
    const [selectedClassId, setSelectedClassId] = useState(initialClassId ?? "");
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [selectedPeriod, setSelectedPeriod] = useState("1");
    const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});
    const [remarksByStudent, setRemarksByStudent] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { state: classState, run: runClasses } = useSafeAsync<ClassOption[]>();
    const { state: studentState, run: runStudents } = useSafeAsync<StudentOption[]>();
    const { state: attendanceState, run: runAttendance } = useSafeAsync<AttendanceRecordRow[]>();

    // Initial load: Classes
    useEffect(() => {
        void runClasses(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string; section?: string; academic_year_id?: string }>>("/api/classes");
            if (!result.ok) throw new Error(result.error.message || "Failed to load classes");

            return result.data.map((item) => ({
                id: item._id,
                label: item.name,
                section: item.section || "A",
                academicYearId: item.academic_year_id
            }));
        });
    }, [runClasses]);

    // Load students when class is selected
    useEffect(() => {
        if (!selectedClassId) return;

        void runStudents(async () => {
            // Use class-specific filtering to ensure correct data and better performance
            const result = await serviceRequest<StudentOption[]>(`/api/students?class_id=${selectedClassId}&status=active`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load students");
            return result.data;
        });
    }, [runStudents, selectedClassId]);

    // Load existing attendance snapshot
    useEffect(() => {
        if (!selectedClassId) {
            setStatusByStudent({});
            return;
        }

        void runAttendance(async () => {
            // Include period in listing to get specific lecture attendance
            const result = await listAttendance({ 
              class_id: selectedClassId, 
              date: selectedDate,
              period: Number(selectedPeriod) 
            });
            if (!result.ok) throw new Error(result.error.message || "Failed to load attendance snapshot");
            return result.data;
        });
    }, [runAttendance, selectedClassId, selectedDate, selectedPeriod]);

    const classOptions = classState.data ?? [];
    const classStudents = useMemo(() => {
        const students = studentState.data ?? [];
        if (!searchQuery) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s => 
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || 
          s.admission_no.toLowerCase().includes(q)
        );
    }, [studentState.data, searchQuery]);

    // Initialize status map from existing attendance
    useEffect(() => {
        if (!selectedClassId || !studentState.data) return;

        const nextStatusMap: Record<string, AttendanceStatus> = {};
        const nextRemarksMap: Record<string, string> = {};
        
        // Default to present for all
        for (const student of studentState.data) {
            nextStatusMap[student._id] = "present";
            nextRemarksMap[student._id] = "";
        }

        // Overlay existing records
        for (const row of attendanceState.data ?? []) {
            nextStatusMap[row.student_id] = row.status as AttendanceStatus;
            nextRemarksMap[row.student_id] = row.note || "";
        }

        setStatusByStudent(nextStatusMap);
        setRemarksByStudent(nextRemarksMap);
    }, [attendanceState.data, studentState.data, selectedClassId]);

    const markedCount = Object.keys(statusByStudent).length;
    const summaryCounts = useMemo(() => {
        const totals = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const status of Object.values(statusByStudent)) {
            totals[status] += 1;
        }
        return totals;
    }, [statusByStudent]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedClassId) {
            showToast("Select a class first.", "error");
            return;
        }

        if (!studentState.data?.length) {
            showToast("No active students found in this class.", "error");
            return;
        }

        setSaving(true);
        try {
            const payload: any = {
                class_id: selectedClassId,
                date: selectedDate,
                period: Number(selectedPeriod),
                records: statusByStudent,
                remarks: remarksByStudent
            };

            const result = await markAttendance(payload);
            if (!result.ok) {
                showToast(result.error.message || "Failed to save attendance", "error");
                return;
            }

            showToast(`Attendance synchronized for ${result.data.saved} students.`, "success");
            onSaved?.();
        } finally {
            setSaving(false);
        }
    }

    if (classState.status === "loading") {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* OPERATIONAL SELECTION BAR */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Select
                    label="Class & Section"
                    value={selectedClassId}
                    onChange={(e: any) => setSelectedClassId(e.target.value)}
                    options={[{ label: "Choose class segment...", value: "" }, ...classOptions.map((item) => ({ label: `${item.label} (Section ${item.section})`, value: item.id }))]}
                    className="h-11 font-black text-slate-800 rounded-xl"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Input
                    label="Attendance Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-11 font-black rounded-xl"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    label="Lecture / Period"
                    value={selectedPeriod}
                    onChange={(e: any) => setSelectedPeriod(e.target.value)}
                    options={periodOptions}
                    className="h-11 font-black rounded-xl"
                  />
                </div>
              </div>

              {selectedClassId && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search student by name or roll no..." 
                      className="pl-10 h-10 bg-slate-50 border-0 focus:bg-white transition-all text-sm rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <StatBadge label="Present" count={summaryCounts.present} color="emerald" />
                    <StatBadge label="Absent" count={summaryCounts.absent} color="red" />
                    <StatBadge label="Late" count={summaryCounts.late} color="amber" />
                  </div>
                </div>
              )}
            </div>

            {/* ROSTER TABLE / LIST */}
            {!selectedClassId ? (
              <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Initialize Roster</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Select a class and lecture to start marking attendance.</p>
              </div>
            ) : studentState.status === "loading" ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : classStudents.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {classStudents.map((student) => {
                        const status = statusByStudent[student._id] ?? "present";
                        return (
                          <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600 shadow-sm">
                                  {student.photo ? (
                                    <img src={student.photo} alt="" className="h-full w-full object-cover rounded-xl" />
                                  ) : (
                                    `${student.first_name[0]}${student.last_name[0]}`
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-slate-900">{student.first_name} {student.last_name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Roll: {student.roll_no || "N/A"} • {student.admission_no}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {statusOptions.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatusByStudent(p => ({ ...p, [student._id]: opt.value }))}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-tight ${
                                      status === opt.value 
                                        ? `${opt.bg} ${opt.color} border-${opt.color.split('-')[1]}-200 shadow-sm` 
                                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                                    }`}
                                  >
                                    <opt.icon className="h-3.5 w-3.5" />
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Input 
                                placeholder="Add note..." 
                                className="h-9 text-[11px] font-medium border-slate-100 bg-slate-50/50 focus:bg-white rounded-lg"
                                value={remarksByStudent[student._id] || ""}
                                onChange={(e) => setRemarksByStudent(p => ({ ...p, [student._id]: e.target.value }))}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <div className="h-16 w-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <UserX className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No Students Found</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Check class assignments or try a different search.</p>
              </div>
            )}

            {/* STICKY SUBMIT FOOTER */}
            <div className="sticky bottom-4 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between z-30">
              <div className="flex items-center gap-6 divide-x divide-slate-100">
                <div className="pr-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Verification Progress</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-slate-900 leading-none">{markedCount}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">/ {studentState.data?.length || 0} Students</p>
                  </div>
                </div>
                <div className="pl-6 flex items-center gap-4">
                   <StatBox label="Today" value={selectedDate} icon={<Calendar className="h-3.5 w-3.5" />} />
                   <StatBox label="Lecture" value={`${selectedPeriod}${Number(selectedPeriod) === 1 ? 'st' : Number(selectedPeriod) === 2 ? 'nd' : Number(selectedPeriod) === 3 ? 'rd' : 'th'} Period`} icon={<Clock className="h-3.5 w-3.5" />} />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={saving || !selectedClassId || !studentState.data?.length} 
                className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-600/20 transition-all font-black text-sm uppercase tracking-widest gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Commit Attendance
                  </>
                )}
              </Button>
            </div>
        </form>
    );
}

function StatBadge({ label, count, color }: { label: string; count: number; color: "emerald" | "red" | "amber" }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-700 border-red-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <div className={`px-3 py-1.5 rounded-xl border font-black text-[10px] flex items-center gap-2 shadow-sm ${styles[color]}`}>
      <span className="opacity-60">{label}:</span>
      <span className="text-xs">{count}</span>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-[10px] font-black text-slate-700">{value}</p>
      </div>
    </div>
  );
}
