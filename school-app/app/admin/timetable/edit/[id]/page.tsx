import { SchoolShell } from "../../../../../layouts/SchoolShell";
import { TimetableEditPage } from "../../../../../modules/timetable/pages/TimetableEditPage";

export default async function AdminTimetableEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <SchoolShell eyebrow="Academic" title="Edit Timetable Entry">
            <TimetableEditPage id={id} />
        </SchoolShell>
    );
}
