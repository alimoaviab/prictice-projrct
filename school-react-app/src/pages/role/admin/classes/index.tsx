import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ClassListPage } from "@/modules/classes/pages/ClassListPage";

export function AdminClassesPage() {
    return (
        <SchoolShell 
            eyebrow="" 
            title=""
        >
            <ClassListPage />
        </SchoolShell>
    );
}
