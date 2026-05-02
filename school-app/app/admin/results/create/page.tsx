import { SchoolShell } from "../../../../layouts/SchoolShell";
import { ResultCreatePage } from "../../../../modules/results/pages/ResultCreatePage";

export default function AdminResultCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Record Result">
            <ResultCreatePage />
        </SchoolShell>
    );
}
