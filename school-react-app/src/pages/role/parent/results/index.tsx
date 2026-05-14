import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultListPage } from "@/modules/results/pages/ResultListPage";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

export function ParentResultsPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Results">
      {!childLoading && selectedChild ? (
        <ResultListPage filters={{ student_id: selectedChild.student_id }} />
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </div>
      )}
    </SchoolShell>
  );
}
