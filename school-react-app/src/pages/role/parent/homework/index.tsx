import { Suspense } from "react";
import { HomeworkPage } from "@/modules/homework/pages/HomeworkPage";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { SchoolShell } from "@/layouts/SchoolShell";

export function ParentHomeworkPage() {
  const { selectedChild, loading } = useSelectedChild();

  return (
    <SchoolShell eyebrow="Parent Portal" title="Student Homework">
      <Suspense fallback={<div>Loading homework...</div>}>
        {loading ? (
            <div className="h-32 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            </div>
        ) : selectedChild ? (
            <HomeworkPage role="PARENT" studentId={selectedChild.student_id} />
        ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-sm font-medium text-slate-500">Please select a student to view their homework.</p>
            </div>
        )}
      </Suspense>
    </SchoolShell>
  );
}
