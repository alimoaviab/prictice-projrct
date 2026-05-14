import React from "react";
import { useParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { HomeworkReviewPage } from "@/modules/homework/pages/HomeworkReviewPage";

export function TeacherHomeworkReviewPage() {
  const params = useParams();
  const homeworkId = params?.id as string;

  return (
    <SchoolShell eyebrow="Teacher Dashboard" title="Homework Submissions Review">
      <HomeworkReviewPage homeworkId={homeworkId} role="TEACHER" />
    </SchoolShell>
  );
}
