import { SchoolShell } from "../../../../layouts/SchoolShell";
import { ClassCreatePage } from "../../../../modules/classes/pages/ClassCreatePage";

export default function AdminClassCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Create Class">
            <ClassCreatePage />
        </SchoolShell>
    );
}
