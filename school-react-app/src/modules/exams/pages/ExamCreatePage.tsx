import { Link } from "react-router-dom";
import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { ExamForm } from "../components/ExamForm";
import { useExams } from "../hooks/useExams";
import { ExamFormInput } from "../types/exam.types";
import { showToast } from "@/utils/toast";

export function ExamCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { addExam } = useExams();
  const { state: classState, run: runClasses } = useSafeAsync<any[]>();

  const loadData = useCallback(() => {
    return runClasses(async () => {
      const result = await serviceRequest<any>("/api/classes");
      if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
      const data = result.data;
      if (Array.isArray(data)) return data;
      return data?.data || data?.items || [];
    });
  }, [runClasses]);

  useEffect(() => {
    void loadData().catch(() => {});
  }, [loadData]);

  const isDependencyLoading =
    classState.status === "idle" || classState.status === "loading";

  async function handleCreate(input: ExamFormInput) {
    const result = await addExam(input);
    if (result.ok) {
      showToast("Exam scheduled successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/exams" : "/admin/exams";
      navigate(basePath);

    }
    return result;
  }

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          to="/admin/exams"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case hover:text-slate-900 transition-all group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          Return to Exams
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case ">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Assessment Management
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT SIDE: Main Form Container (70%) */}
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            {/* Premium Internal Header */}
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-lg shadow-amber-600/20">
                  <span className="material-symbols-outlined text-lg">quiz</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Schedule New Exam</h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Configure exam parameters and assessment settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {classState.status === "error" ? (
                <DataState variant="error" title="Failed to load classes" message={classState.error} />
              ) : isDependencyLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <ExamForm 
                  classes={classState.data ?? []} 
                  onCreate={handleCreate} 
                />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Guidance Panel (30%) */}
        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <span className="material-symbols-outlined text-base">info</span>
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">Assessment Guide</h3>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  What is an Exam?
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Exams are structured assessments that evaluate student learning across subjects and classes with defined scoring parameters.
                </p>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Status Lifecycle
                </h4>
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
                  <p className="text-[10px] leading-snug text-amber-800 font-bold">
                    Exams progress from Scheduled → Published → Results Published → Completed.
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Setup Tips</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-600 italic">Mid-Term Math</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-600 italic">100 Marks</span>
                </div>
              </section>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Quick Checklist</h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                    Select target class
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                    Configure exam parameters
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                    Add instructions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
