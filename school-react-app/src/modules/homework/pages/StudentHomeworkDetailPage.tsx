import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataState, Skeleton, Badge } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { ChevronLeft, FileText, Calendar, User, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

interface Submission {
  status: "pending" | "submitted" | "late" | "missing";
  grade?: number;
  feedback?: string;
  submitted_at?: string;
}

interface HomeworkDetails {
  _id: string;
  title: string;
  instructions: string;
  subject: string;
  subject_name: string;
  class_name: string;
  max_score: number;
  status: string;
  due_at: string;
  teacher_name: string;
  my_submission?: Submission;
}

export function StudentHomeworkDetailPage({ homeworkId }: { homeworkId: string }) {
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
  const submission = hw.my_submission;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/student/homework" className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900">{hw.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 font-black uppercase text-[9px]">{hw.subject_name || hw.subject}</Badge>
              <Badge variant="secondary" className="bg-slate-50 text-slate-600 border-slate-100 font-black uppercase text-[9px]">{hw.class_name}</Badge>
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
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Instructions</h3>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600 leading-relaxed font-medium">
                {hw.instructions || "No detailed instructions provided for this assignment."}
              </p>
            </div>

            {hw.status === 'assigned' && (
                <div className="mt-12 p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                    <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Submission Note</p>
                    <p className="text-xs text-indigo-900/70 font-medium">
                        Please complete your work and submit it to your teacher in class or as per the instructions provided above.
                    </p>
                </div>
            )}
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
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Assigned By</p>
                    <p className="text-[11px] font-black text-slate-900">{hw.teacher_name || "Class Teacher"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Due Date</p>
                    <p className="text-[11px] font-black text-rose-600">{formatDate(hw.due_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Max Score</p>
                    <p className="text-[11px] font-black text-slate-900">{hw.max_score} Points</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Status</p>
                {!submission ? (
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-amber-600 uppercase">Pending</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${submission.status === 'submitted' || submission.status === 'late' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className={`text-xs font-black uppercase ${submission.status === 'submitted' || submission.status === 'late' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {submission.status}
                            </span>
                        </div>
                        {submission.grade !== undefined && (
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-600 uppercase leading-none mb-1">Your Grade</p>
                                <p className="text-xl font-black text-emerald-900">{submission.grade} <span className="text-[10px] font-bold text-emerald-400">/ {hw.max_score}</span></p>
                                {submission.feedback && (
                                    <p className="text-[10px] font-medium text-emerald-700 mt-2 italic">"{submission.feedback}"</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
