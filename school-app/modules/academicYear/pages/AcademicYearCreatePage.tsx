"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "../../../components/ui";
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/academic-years"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Academic Years
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Academic Year</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define a new academic session for the school.
          </p>
        </div>
        <AcademicYearForm onCreate={handleCreate} />
      </Card>
    </div>
  );
}
