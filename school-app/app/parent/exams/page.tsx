"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { ExamListPage } from "../../../modules/exams/pages/ExamListPage";
import { useAuth } from "../../../hooks/useAuth";

export default function ParentExamsPage() {
  const { user } = useAuth();
  
  return (
    <SchoolShell eyebrow="Parent Dashboard" title="Child's Exam Schedule">
      <ExamListPage filters={user?.classId ? { class_id: user.classId } : undefined} />
    </SchoolShell>
  );
}
