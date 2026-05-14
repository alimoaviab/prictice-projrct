import { DataState, TableSkeleton } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { TimetableGrid } from "@/modules/timetable/components/TimetableGrid";
import { useTimetable } from "@/modules/timetable/hooks/useTimetable";
import { useAuth } from "@/hooks/useAuth";

export function StudentTimetablePage() {
    const { user } = useAuth();
    const { state } = useTimetable(user?.classId ? { class_id: user.classId } : undefined);

    return (
        <SchoolShell eyebrow="Parent Portal" title="Timetable">
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Weekly Schedule</h2>
                    <p className="text-sm text-gray-500">Your current class timetable and subject slots</p>
                </div>

                {state.status === "loading" && <TableSkeleton />}
                {state.status === "error" && <DataState variant="error" title="Timetable unavailable" message={state.error} />}
                {state.status === "success" && <TimetableGrid records={state.data || []} />}
            </div>
        </SchoolShell>
    );
}