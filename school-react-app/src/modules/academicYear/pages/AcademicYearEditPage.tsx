import { AppIcon } from "shared/ui/AppIcon";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearFormInput, AcademicYearRow } from "../types/academicYear.types";
import { Skeleton } from "@/components/ui";

export function AcademicYearEditPage() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id as string;
  const { updateAcademicYear, state } = useAcademicYears();
  const [initialData, setInitialData] = useState<AcademicYearRow | null>(null);

  useEffect(() => {
    if (state.data?.data) {
        const found = state.data.data.find(y => y._id === id);
        if (found) {
            setInitialData(found);
        }
    }
  }, [state.data, id]);

  async function handleUpdate(input: AcademicYearFormInput) {
    const result = await updateAcademicYear(id, input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      // Toast is already raised by useAcademicYears on success.
      navigate("/admin/academic-years");
    }
    return result;
  }

  if (state.status === "loading" && !initialData) {
    return (
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="flex flex-col lg:flex-row gap-8">
                <Skeleton className="h-[400px] flex-1 rounded-3xl" />
                <Skeleton className="h-[400px] w-80 rounded-3xl" />
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          to="/admin/academic-years"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case  hover:text-slate-900 transition-all group"
        >
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Return to Sessions
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case ">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          System Editor
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT SIDE: Main Form Container (70%) */}
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <AppIcon name="CalendarDays" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Modify Academic Session</h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Adjust institutional timeline and operational cycles.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {initialData ? (
                  <AcademicYearForm onCreate={handleUpdate} initialData={initialData} />
              ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                      Loading session data...
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Guidance Panel (30%) */}
        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <AppIcon name="Wand2" size={16} />
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">Update Intelligence</h3>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Editing Safeguards
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Modifying session dates may affect attendance calculations and exam schedules. Ensure these align with your updated timeline.
                </p>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Active Status Sync
                </h4>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                  <p className="text-[10px] leading-snug text-blue-800 font-bold">
                    If you mark this session as active, any other active session will be automatically deactivated.
                  </p>
                </div>
              </section>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Data Consistency</h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Verify dates again
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Audit notes
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
