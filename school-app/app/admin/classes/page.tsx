import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { ClassListPage } from "../../../modules/classes/pages/ClassListPage";

export default function AdminClassesPage() {
    return (
        <SchoolShell 
            eyebrow="" 
            title=""
        >
            <ClassListPage />
        </SchoolShell>
    );
}
