import { SchoolShell } from "@/layouts/SchoolShell";
import { ExamListPage } from "@/modules/exams/pages/ExamListPage";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

export function ParentExamsPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Exam Schedule">
      {!childLoading && selectedChild ? (
        <ExamListPage filters={{ class_id: selectedChild.class_id }} />
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      )}
    </SchoolShell>
  );
}
