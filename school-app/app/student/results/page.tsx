"use client";

import { SchoolShell } from "../../../layouts/SchoolShell";
import { ResultListPage } from "../../../modules/results/pages/ResultListPage";
import { useAuth } from "../../../hooks/useAuth";

export default function StudentResultsPage() {
    const { user } = useAuth();

    return (
        <SchoolShell eyebrow="Student Portal" title="Exam Results">
            <ResultListPage filters={user?.studentId ? { student_id: user.studentId } : undefined} />
        </SchoolShell>
    );
}