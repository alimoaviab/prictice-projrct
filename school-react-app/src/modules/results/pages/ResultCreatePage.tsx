import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { ResultForm } from "../components/ResultForm";
import { useResults } from "../hooks/useResults";
import { ResultFormInput } from "../types/result.types";
import { showToast } from "@/utils/toast";

export function ResultCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { addResult } = useResults();

  const { state: studentState, run: runStudents } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: examState, run: runExams } = useSafeAsync<Array<{ _id: string; title: string }>>();

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runStudents(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/students");
        if (!result.ok) throw new Error(result.error.message || "Failed to load students");
        return result.data;
      }),
      runExams(async () => {
        const result = await serviceRequest<Array<{ _id: string; title: string }>>("/api/exams");
        if (!result.ok) throw new Error(result.error.message || "Failed to load exams");
        return result.data;
      })
    ]);
  }, [runStudents, runExams]);

  useEffect(() => {
    void loadDependencies().catch(() => {});
  }, [loadDependencies]);

  const isLoading = studentState.status === "loading" || examState.status === "loading" || studentState.status === "idle";

  async function handleCreate(input: ResultFormInput) {
    const result = await addResult(input);
    if (result.ok) {
      // Toast is already raised by useResults on success.
      const basePath = pathname.includes("/teacher") ? "/teacher/results" : "/admin/results";
      navigate(basePath);
    } else {
      showToast(result.error.message || "Failed to record result", "error");
    }
    return result;
  }

  if (studentState.status === "error" || examState.status === "error") {
    return <DataState variant="error" title="Failed to load dependencies" message={studentState.error || examState.error} />;
  }

  const studentOptions = (studentState.data ?? []).map(s => ({ id: s._id, label: s.name }));
  const examOptions = (examState.data ?? []).map(e => ({ id: e._id, label: e.title }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={pathname.includes("/teacher") ? "/teacher/results" : "/admin/results"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Results
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Record Exam Result</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter marks and grades for a student's exam performance.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <ResultForm
            onCreate={handleCreate}
            studentOptions={studentOptions}
            examOptions={examOptions}
          />
        )}
      </Card>
    </div>
  );
}
