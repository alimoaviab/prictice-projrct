import { SchoolShell } from "@/layouts/SchoolShell";
import { AcademicYearCreatePage } from "@/modules/academicYear/pages/AcademicYearCreatePage";

// Wrapper intentionally omits the SchoolShell title/eyebrow — the
// underlying create page renders its own compact back-link + section
// label, so we let it own the top-of-page real estate.
export function AdminAcademicYearCreatePage() {
    return (
        <SchoolShell>
            <AcademicYearCreatePage />
        </SchoolShell>
    );
}
