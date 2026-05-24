import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataState, Input, Skeleton, Badge, Select } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";
import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
}

interface Submission {
  student_id: Student | string;
  status: "pending" | "submitted" | "late" | "missing";
  grade?: number;
  feedback?: string;
  attachment_urls?: string[];
}

interface HomeworkDetails {
  _id: string;
  title: string;
  subject: string;
  class_name: string;
  class_id: string;
  max_score: number;
  status: string;
  due_at: string;
  submissions: Submission[];
}

export function HomeworkReviewPage({ homeworkId, role = "TEACHER" }: { homeworkId: string; role?: "ADMIN" | "TEACHER" }) {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { state: hwState, run: runHw } = useSafeAsync<HomeworkDetails>();

  useEffect(() => {
    if (!homeworkId) return;
    void runHw(async () => {
      const result = await serviceRequest<HomeworkDetails>(`/api/homework/${homeworkId}`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load homework details");
      return result.data;
    });
  }, [runHw, homeworkId]);

  useEffect(() => {
    if (!hwState.data) return;
    const initialSubs: Record<string, Submission> = {};
    hwState.data.submissions.forEach(sub => {
      const studentId = typeof sub.student_id === "object" ? sub.student_id._id : sub.student_id;
      initialSubs[studentId] = { ...sub };
    });
    setSubmissions(initialSubs);
  }, [hwState.data]);

  const filteredStudents = useMemo(() => {
    if (!hwState.data) return [];
    const subs = Object.values(submissions);
    if (!searchQuery) return subs;
    const q = searchQuery.toLowerCase();
    return subs.filter(s => {
      if (typeof s.student_id === "object") {
        return `${s.student_id.first_name} ${s.student_id.last_name}`.toLowerCase().includes(q) || 
               s.student_id.admission_no.toLowerCase().includes(q);
      }
      return false;
    });
  }, [submissions, searchQuery, hwState.data]);

  const handleChange = (studentId: string, field: keyof Submission, value: any) => {
    setSubmissions(prev => ({
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
      // In a real implementation, we would just update the submissions array.
      // We will PATCH the homework record with the new submissions array.
      const updatedSubmissions = Object.values(submissions).map(s => ({
        student_id: typeof s.student_id === "object" ? s.student_id._id : s.student_id,
        status: s.status,
        grade: s.grade,
        feedback: s.feedback,
        attachment_urls: s.attachment_urls
      }));

      const result = await serviceRequest(`/api/homework/${homeworkId}`, {
        method: "PATCH",
        body: JSON.stringify({ submissions: updatedSubmissions })
      });

      if (!result.ok) throw new Error(result.error.message || "Failed to save reviews");
      
      showToast("Homework submissions reviewed successfully.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (hwState.status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (hwState.status === "error") {
    return <DataState variant="error" title="Workspace Load Failed" message={hwState.error} />;
  }

  const hw = hwState.data!;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Link to={role === "ADMIN" ? "/admin/homework" : "/teacher/homework"} className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <AppIcon name="ChevronLeft" className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900">{hw.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 font-black uppercase text-[9px]">{hw.subject}</Badge>
              <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-black uppercase text-[9px]">{hw.class_name}</Badge>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Max Score: {hw.max_score}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
          <div className="relative flex-1 min-w-[300px]">
            <AppIcon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search student for review..." 
              className="pl-10 h-11 bg-slate-50 border-0 focus:bg-white transition-all text-sm rounded-xl font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6 px-6 border-l border-slate-100">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Graded Progress</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-slate-900 leading-none">{Object.values(submissions).filter(s => s.grade !== undefined && s.grade !== null).length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">/ {hw.submissions.length} Students</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* REVIEW TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Identity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-40">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-48">Score</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((sub) => {
                const student = typeof sub.student_id === "object" ? sub.student_id : null;
                if (!student) return null;
                const studentId = student._id;
                const entry = submissions[studentId];

                return (
                  <tr key={studentId} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-black text-slate-900">{student.first_name} {student.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{student.admission_no}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={entry.status}
                        onChange={(e) => handleChange(studentId, "status", e.target.value)}
                        className={`h-8 w-32 rounded-lg text-[10px] font-black uppercase tracking-tight border-0 transition-all cursor-pointer ${
                          entry.status === "missing" ? "bg-red-100 text-red-600" : 
                          entry.status === "submitted" ? "bg-emerald-100 text-emerald-600" :
                          entry.status === "late" ? "bg-amber-100 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="late">Late</option>
                        <option value="missing">Missing</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number"
                          max={hw.max_score}
                          min={0}
                          placeholder="--"
                          className="h-10 w-24 text-center font-black rounded-xl border-slate-100 bg-slate-50 focus:bg-white"
                          value={entry.grade === undefined ? "" : entry.grade}
                          onChange={(e) => handleChange(studentId, "grade", e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <span className="text-[10px] font-bold text-slate-300">/ {hw.max_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Input 
                        placeholder="Add constructive feedback..." 
                        className="h-10 text-[11px] font-medium border-slate-100 bg-slate-50/50 focus:bg-white rounded-xl"
                        value={entry.feedback || ""}
                        onChange={(e) => handleChange(studentId, "feedback", e.target.value)}
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
            <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
              <AppIcon name="Users" className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-purple-300 leading-none mb-1">Total Submissions</p>
              <p className="text-xs font-black leading-none">{hw.submissions.length} Students</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 flex items-center gap-10">
           <div className="flex items-center gap-3">
             <AppIcon name="AlertCircle" className="h-4 w-4 text-amber-400" />
             <p className="text-[10px] font-bold text-slate-300">Ensure grades do not exceed max score (<span className="text-white">{hw.max_score}</span>).</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={saving}
          className="h-11 px-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving Reviews...
            </>
          ) : (
            <>
              <AppIcon name="Save" className="h-4 w-4" />
              Commit Reviews
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
