import { useEffect, useMemo, useState } from "react";
import { 
  Button, 
  DataState, 
  Input, 
  Skeleton,
  Badge,
  Card
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";
import { 
  ChevronLeft,
  Save,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ArrowRight
} from "@/components/icons";
import { Link } from "react-router-dom";

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
  roll_no?: string;
}

interface ExamDetails {
  _id: string;
  title: string;
  subject: string;
  class_name: string;
  class_id: string;
  max_marks: number;
  academic_year_id: string;
}

interface MarkEntry {
  student_id: string;
  obtained_marks: number | "";
  remarks: string;
  attendance_status: "present" | "absent";
}

export function ExamMarksEntryPage({ examId, role = "TEACHER" }: { examId: string; role?: "ADMIN" | "TEACHER" }) {
  const [marks, setMarks] = useState<Record<string, MarkEntry>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { state: examState, run: runExam } = useSafeAsync<ExamDetails>();
  const { state: studentState, run: runStudents } = useSafeAsync<Student[]>();

  useEffect(() => {
    if (!examId) return;

    void runExam(async () => {
      const result = await serviceRequest<ExamDetails>(`/api/exams/${examId}`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load exam details");
      return result.data;
    });
  }, [runExam, examId]);

  useEffect(() => {
    if (!examState.data?.class_id) return;

    void runStudents(async () => {
      const result = await serviceRequest<Student[]>(`/api/students?class_id=${examState.data?.class_id}&status=active`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load students");
      return result.data;
    });
  }, [runStudents, examState.data?.class_id]);

  // Initialize marks state
  useEffect(() => {
    if (!studentState.data) return;

    const initialMarks: Record<string, MarkEntry> = {};
    studentState.data.forEach(student => {
      initialMarks[student._id] = {
        student_id: student._id,
        obtained_marks: "",
        remarks: "",
        attendance_status: "present"
      };
    });
    setMarks(initialMarks);

    // Fetch existing results if any
    void (async () => {
      const result = await serviceRequest<any[]>(`/api/exams/${examId}/results`);
      if (result.ok && result.data.length > 0) {
        const existingMarks: Record<string, MarkEntry> = { ...initialMarks };
        result.data.forEach(res => {
          existingMarks[res.student_id] = {
            student_id: res.student_id,
            obtained_marks: res.obtained_marks,
            remarks: res.remarks || "",
            attendance_status: res.obtained_marks === -1 ? "absent" : "present"
          };
        });
        setMarks(existingMarks);
      }
    })();
  }, [studentState.data, examId]);

  const filteredStudents = useMemo(() => {
    const students = studentState.data ?? [];
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || 
      s.admission_no.toLowerCase().includes(q)
    );
  }, [studentState.data, searchQuery]);

  const handleMarkChange = (studentId: string, field: keyof MarkEntry, value: any) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = Object.values(marks).map(m => ({
        student_id: m.student_id,
        obtained_marks: m.attendance_status === "absent" ? -1 : (Number(m.obtained_marks) || 0),
        remarks: m.remarks
      }));

      const result = await serviceRequest(`/api/exams/${examId}/results`, {
        method: "POST",
        body: JSON.stringify({ results: payload })
      });

      if (!result.ok) throw new Error(result.error.message || "Failed to save marks");
      
      showToast("Examination marks synchronized successfully.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (examState.status === "loading" || examState.status === "idle" || studentState.status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (examState.status === "error") {
    return <DataState variant="error" title="Workspace Load Failed" message={examState.error} />;
  }

  const exam = examState.data!;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Link to={role === "ADMIN" ? "/admin/exams" : "/teacher/exams"} className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900">{exam.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-black uppercase text-[9px]">{exam.subject}</Badge>
              <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-black uppercase text-[9px]">{exam.class_name}</Badge>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Max Marks: {exam.max_marks}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search student for evaluation..." 
              className="pl-10 h-11 bg-slate-50 border-0 focus:bg-white transition-all text-sm rounded-xl font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6 px-6 border-l border-slate-100">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Evaluation Progress</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-slate-900 leading-none">{Object.values(marks).filter(m => m.obtained_marks !== "").length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">/ {studentState.data?.length || 0} Students</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MARKS ENTRY TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">Roll</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Obtained Marks</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => {
                const entry = marks[student._id] || { attendance_status: "present", obtained_marks: "", remarks: "" };
                const isAbsent = entry.attendance_status === "absent";

                return (
                  <tr key={student._id} className={`transition-colors ${isAbsent ? "bg-red-50/20" : "hover:bg-slate-50/50"}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-400">#{student.roll_no || "--"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">{student.first_name} {student.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{student.admission_no}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={entry.attendance_status}
                        onChange={(e) => handleMarkChange(student._id, "attendance_status", e.target.value)}
                        className={`h-8 w-24 rounded-lg text-[10px] font-black uppercase tracking-tight border-0 transition-all cursor-pointer ${
                          isAbsent ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number"
                          max={exam.max_marks}
                          min={0}
                          placeholder="00"
                          disabled={isAbsent}
                          className={`h-10 w-24 text-center font-black rounded-xl border-slate-100 ${isAbsent ? "bg-slate-100" : "bg-slate-50 focus:bg-white"}`}
                          value={isAbsent ? "" : entry.obtained_marks}
                          onChange={(e) => handleMarkChange(student._id, "obtained_marks", e.target.value)}
                        />
                        <span className="text-[10px] font-bold text-slate-300">/ {exam.max_marks}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Input 
                        placeholder="Add performance remark..." 
                        className="h-10 text-[11px] font-medium border-slate-100 bg-slate-50/50 focus:bg-white rounded-xl"
                        value={entry.remarks}
                        onChange={(e) => handleMarkChange(student._id, "remarks", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-6xl bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between z-50">
        <div className="flex items-center gap-6 px-4 border-r border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-blue-300 leading-none mb-1">Roster Count</p>
              <p className="text-xs font-black leading-none">{studentState.data?.length || 0} Students</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 flex items-center gap-10">
           <div className="flex items-center gap-3">
             <AlertCircle className="h-4 w-4 text-amber-400" />
             <p className="text-[10px] font-bold text-slate-300">Ensure marks do not exceed max threshold (<span className="text-white">{exam.max_marks}</span>).</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={saving || !studentState.data?.length}
          className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Synchronizing...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Commit Marks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
