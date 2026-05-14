import { SchoolShell } from "@/layouts/SchoolShell";
import { AcademicYearCreatePage } from "@/modules/academicYear/pages/AcademicYearCreatePage";

export function AdminAcademicYearCreatePage() {
    return (
        <SchoolShell eyebrow="Academic" title="Create Academic Year">
            <AcademicYearCreatePage />
        </SchoolShell>
    );
}
