import { SchoolShell } from "../../../layouts/SchoolShell";
import { AcademyCarePage } from "../../../modules/academyCare/pages/AcademyCarePage";

export default function Page() {
    return (
        <SchoolShell eyebrow="Configuration" title="Academy Care">
            <AcademyCarePage />
        </SchoolShell>
    );
}
