import { SchoolShell } from "../../../layouts/SchoolShell";
import { ClassListPage } from "../../../modules/classes/pages/ClassListPage";

export default function AdminClassesPage() {
    return (
        <SchoolShell eyebrow="Academic" title="Classes">
            <ClassListPage />
        </SchoolShell>
    );
}
