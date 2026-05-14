import { SchoolShell } from "@/layouts/SchoolShell";
import { BehaviorListPage } from "@/modules/behavior/pages/BehaviorListPage";
import { useAuth } from "@/hooks/useAuth";

export function ParentBehaviorPage() {
  const { user } = useAuth();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Behavior Records">
      <BehaviorListPage filters={user?.studentId ? { student_id: user.studentId } : undefined} />
    </SchoolShell>
  );
}
