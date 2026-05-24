import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataState, Skeleton, Badge } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";

interface HomeworkDetails {
  _id: string;
  title: string;
  instructions: string;
  subject: string;
  subject_name: string;
  class_name: string;
  class_id: string;
  max_score: number;
  status: string;
  due_at: string;
  teacher_name: string;
  submissions?: Array<{
    student_id: string;
    status: "pending" | "submitted" | "late" | "missing";
    grade?: number;
  }>;
}

export function TeacherHomeworkDetailPage({ homeworkId }: { homeworkId: string }) {
  const navigate = useNavigate();
  const { state: hwState, run: runHw } = useSafeAsync<HomeworkDetails>();

  useEffect(() => {
    if (!homeworkId) return;
    void runHw(async () => {
      const result = await serviceRequest<HomeworkDetails>(`/api/homework/${homeworkId}`);
      if (!result.ok) throw new Error(result.error.message || "Failed to load homework details");
      return result.data;
    });
  }, [runHw, homeworkId]);

  if (hwState.status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (hwState.status === "error") {
    return <DataState variant="error" title="Load Failed" message={hwState.error} />;
  }

  const hw = hwState.data!;
  const submissions = hw.submissions || [];
  const submittedCount = submissions.filter(s => s.status === "submitted" || s.status === "late").length;
  const gradedCount = submissions.filter(s => s.grade !== undefined && s.grade !== null).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOverdue = new Date(hw.due_at) < new Date();

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/teacher/homework" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <AppIcon name="ChevronLeft" className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900">{hw.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 font-black uppercase text-[9px]">{hw.subject_name || hw.subject}</Badge>
              <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-black uppercase text-[9px]">{hw.class_name}</Badge>
              {isOverdue && hw.status === "assigned" && (
                <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 font-black uppercase text-[9px]">Overdue</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm min-h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <AppIcon name="FileText" className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Instructions</h3>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed font-medium">
                {hw.instructions || "No detailed instructions provided for this assignment."}
              </p>
            </div>
          </div>
        </div>

        {/* SIDEBAR INFO */}
        <div className="space-y-6">
          {/* ASSIGNMENT INFO */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assignment Details</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <AppIcon name="User" className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Created By</p>
                    <p className="text-[11px] font-black text-slate-900">{hw.teacher_name || "Class Teacher"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <AppIcon name="Calendar" className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Due Date</p>
                    <p className={`text-[11px] font-black ${isOverdue && hw.status === "assigned" ? "text-rose-600" : "text-slate-900"}`}>
                      {formatDate(hw.due_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <AppIcon name="BookOpen" className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Max Score</p>
                    <p className="text-[11px] font-black text-slate-900">{hw.max_score} Points</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</p>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${hw.status === "assigned" ? "bg-blue-500" : hw.status === "draft" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <span className={`text-xs font-black uppercase ${hw.status === "assigned" ? "text-blue-600" : hw.status === "draft" ? "text-amber-600" : "text-emerald-600"}`}>
                  {hw.status}
                </span>
              </div>
            </div>
          </div>

          {/* SUBMISSION STATS */}
          {submissions.length > 0 && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Stats</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AppIcon name="Users" className="h-4 w-4 text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-600">Total Students</span>
                  </div>
                  <span className="text-[13px] font-black text-slate-900">{submissions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-600">Submitted</span>
                  </div>
                  <span className="text-[13px] font-black text-emerald-600">{submittedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-[11px] font-bold text-slate-600">Graded</span>
                  </div>
                  <span className="text-[13px] font-black text-purple-600">{gradedCount}</span>
                </div>
              </div>

              <button
                onClick={() => navigate(`/teacher/homework/${homeworkId}/review`)}
                className="w-full mt-4 h-10 px-4 rounded-lg bg-purple-600 text-white text-[12px] font-bold shadow-sm shadow-purple-600/15 hover:bg-purple-700 transition-colors active:scale-[0.98]"
              >
                Review Submissions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
