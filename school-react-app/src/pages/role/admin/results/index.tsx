import { useSearchParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ResultPage } from "@/modules/results/pages/ResultPage";

export function AdminResultsPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Results">
            <ResultPage />
        </SchoolShell>
    );
}
