import { SchoolShell } from "../../../layouts/SchoolShell";
import { AcademicYearPage } from "../../../modules/academicYear/pages/AcademicYearPage";

export default function AdminAcademicYearPage() {
    return (
        <SchoolShell eyebrow="Settings" title="Academic Years">
            <AcademicYearPage />
        </SchoolShell>
    );
}
