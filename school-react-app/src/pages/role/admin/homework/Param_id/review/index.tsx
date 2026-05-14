import React from "react";
import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkReviewPage } from "@/modules/homework/pages/HomeworkReviewPage";

export function AdminHomeworkReviewPage() {
  const params = useParams();
  const homeworkId = params?.id as string;

  return (
    <SchoolShell eyebrow="Admin Dashboard" title="Homework Submissions Review">
      <HomeworkReviewPage homeworkId={homeworkId} role="ADMIN" />
    </SchoolShell>
  );
}
