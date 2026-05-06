"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AcademicYearForm } from "../components/AcademicYearForm";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearFormInput } from "../types/academicYear.types";
import { showToast } from "../../../utils/toast";

export function AcademicYearCreatePage() {
  const router = useRouter();
  const { addAcademicYear } = useAcademicYears();

  async function handleCreate(input: AcademicYearFormInput) {
    const result = await addAcademicYear(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Academic year created successfully", "success");
      router.push("/admin/academic-years");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="mb-3">
        <Link
          href="/admin/academic-years"
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em] hover:text-blue-700 transition-all group"
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          Back to Sessions
        </Link>
      </div>

      <div className="bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-blue-100 bg-blue-50/30">
          <h2 className="text-lg font-bold text-black tracking-tight">New Academic Session</h2>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            Configure the start and end dates for a new school year.
          </p>
        </div>
        <div className="px-5 py-4 md:px-6 md:py-5">
          <AcademicYearForm onCreate={handleCreate} />
        </div>
      </div>
    </div>
  );
}
