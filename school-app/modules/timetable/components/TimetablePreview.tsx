"use client";

import { useMemo } from "react";
import { Card } from "../../../components/ui";
import { useTimetable } from "../hooks/useTimetable";
import { getDayLabel } from "../types/timetable.types";

export function TimetablePreview({ classId, teacherId }: { classId?: string; teacherId?: string }) {
    const filters = useMemo(() => {
        if (classId) return { class_id: classId };
        if (teacherId) return { teacher_id: teacherId };
        return undefined;
    }, [classId, teacherId]);

    const { state } = useTimetable(filters);

    const rows = (state.data || []).slice(0, 5);

    return (
        <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Timetable Preview</h2>
                    <p className="text-sm text-gray-500">Latest scheduled entries</p>
                </div>
            </div>

            {state.status === "loading" && <p className="text-sm text-gray-500">Loading timetable...</p>}
            {state.status === "error" && <p className="text-sm text-red-600">{state.error}</p>}
            {state.status === "success" && rows.length === 0 && (
                <p className="text-sm text-gray-500">No timetable entries available.</p>
            )}

            {rows.length > 0 && (
                <div className="space-y-3">
                    {rows.map((row) => (
                        <div key={row._id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{row.subject_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {getDayLabel(row.day_of_week)} · Period {row.period_number}
                                    </p>
                                </div>
                                <p className="text-xs font-medium text-gray-600">{row.start_time} - {row.end_time}</p>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {row.class_name} · {row.teacher_name} · {row.room || "No room set"}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}