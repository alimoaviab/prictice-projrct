import { SchoolShell } from "../../../layouts/SchoolShell";
import { AcademicYearListPage } from "../../../modules/academicYear/pages/AcademicYearListPage";

export default function AdminAcademicYearPage() {
    return (
        <SchoolShell eyebrow="" title="">
            <AcademicYearListPage />
        </SchoolShell>
    );
}
