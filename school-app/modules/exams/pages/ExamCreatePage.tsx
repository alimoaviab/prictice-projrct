"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { ExamForm } from "../components/ExamForm";
import { useExams } from "../hooks/useExams";
import { ExamFormInput } from "../types/exam.types";
import { showToast } from "../../../utils/toast";

export function ExamCreatePage() {
  const router = useRouter();
  const { addExam } = useExams();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadClasses = useCallback(() => {
    return runClasses(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load classes");
      }
      return result.data;
    });
  }, [runClasses]);

  useEffect(() => {
    void loadClasses().catch(() => {});
  }, [loadClasses]);

  const isDependencyLoading = classState.status === "idle" || classState.status === "loading";
  const classOptions = (classState.data ?? []).map((item) => ({ id: item._id, label: item.name }));

  async function handleCreate(input: ExamFormInput) {
    const result = await addExam(input);
    if (result.ok) {
      showToast("Exam scheduled successfully", "success");
      router.push("/admin/exams");
      router.refresh();
    }
    return result;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/exams"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Exams
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Schedule New Exam</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create a new examination schedule for specific classes and subjects.
          </p>
        </div>

        {classState.status === "error" ? (
          <DataState variant="error" title="Failed to load classes" message={classState.error} />
        ) : isDependencyLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <ExamForm classOptions={classOptions} onCreate={handleCreate} />
        )}
      </Card>
    </div>
  );
}
