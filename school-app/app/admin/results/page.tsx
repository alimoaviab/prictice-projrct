"use client";

import { useSearchParams } from "next/navigation";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { ResultPage } from "../../../modules/results/pages/ResultPage";

export default function AdminResultsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Results">
            <ResultPage />
        </SchoolShell>
    );
}
