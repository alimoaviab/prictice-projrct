import { AppIcon } from "shared/ui/AppIcon";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearFormInput } from "../types/academicYear.types";

export function AcademicYearCreatePage() {
  const navigate = useNavigate();
  const { addAcademicYear } = useAcademicYears();

  async function handleCreate(input: AcademicYearFormInput) {
    const result = await addAcademicYear(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      // Toast is already shown by the hook — no duplicate here
      navigate("/admin/academic-years");
    }
    return result;
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
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Configurator
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT SIDE: Main Form Container (70%) */}
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            {/* Premium Internal Header */}
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <AppIcon name="Calendar" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">New Academic Session</h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Initialize institutional timeline and operational cycles.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <AcademicYearForm onCreate={handleCreate} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Guidance Panel (30%) */}
        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <AppIcon name="Info" size={16} />
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">Setup Intelligence</h3>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  What is a Session?
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Academic sessions organize yearly school operations, including exams, attendance cycles, and progression.
                </p>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Activation Rule
                </h4>
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2.5">
                  <p className="text-[10px] leading-snug text-blue-800 font-bold">
                    Constraint: Only one session should remain active at a time to ensure data consistency.
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Naming Guide</h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-600 italic">2025–2026</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-bold text-slate-600 italic">Spring 2026</span>
                </div>
              </section>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 normal-case  mb-2.5">Quick Checklist</h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Verify operation dates
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Enable Active Status
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
