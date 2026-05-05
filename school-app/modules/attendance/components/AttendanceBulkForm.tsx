"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, DataState, Input, Select, Skeleton } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { showToast } from "../../../utils/toast";
import { serviceRequest } from "../../../services/service-client";
import { listAttendance, markAttendance } from "../services/attendance.service";
import { AttendanceBulkInput, AttendanceStatus, AttendanceRecordRow } from "../types/attendance.types";

interface ClassOption {
    id: string;
    label: string;
    academicYearId?: string;
}

interface StudentOption {
    _id: string;
    first_name: string;
    last_name: string;
    admission_no: string;
    class_id: string;
    status: "active" | "inactive" | "graduated" | "transferred";
}

interface AttendanceBulkFormProps {
    initialClassId?: string;
    onSaved?: () => void;
}

const statusOptions: Array<{ label: string; value: AttendanceStatus }> = [
    { label: "Present", value: "present" },
    { label: "Absent", value: "absent" },
    { label: "Late", value: "late" },
    { label: "Excused", value: "excused" }
];

function getToday() {
    return new Date().toISOString().split("T")[0];
}

export function AttendanceBulkForm({ initialClassId, onSaved }: AttendanceBulkFormProps) {
    const [selectedClassId, setSelectedClassId] = useState(initialClassId ?? "");
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [statusByStudent, setStatusByStudent] = useState<Record<string, AttendanceStatus>>({});
    const [saving, setSaving] = useState(false);

    const { state: classState, run: runClasses } = useSafeAsync<ClassOption[]>();
    const { state: studentState, run: runStudents } = useSafeAsync<StudentOption[]>();
    const { state: attendanceState, run: runAttendance } = useSafeAsync<AttendanceRecordRow[]>();

    useEffect(() => {
        void runClasses(async () => {
            const result = await serviceRequest<Array<{ _id: string; name: string; academy_care_id?: string }>>("/api/classes");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load classes");
            }

            return result.data.map((item) => ({
                id: item._id,
                label: item.name,
                academicYearId: item.academy_care_id
            }));
        }).catch(() => {
            // useSafeAsync already tracks the error state.
        });

        void runStudents(async () => {
            const result = await serviceRequest<StudentOption[]>("/api/students");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        }).catch(() => {
            // useSafeAsync already tracks the error state.
        });
    }, [runClasses, runStudents]);

    useEffect(() => {
        if (!selectedClassId) {
            setStatusByStudent({});
            return;
        }

        void runAttendance(async () => {
            const result = await listAttendance({ class_id: selectedClassId, date: selectedDate });
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load attendance snapshot");
            }

            return result.data;
        }).catch(() => {
            // useSafeAsync already tracks the error state.
        });
    }, [runAttendance, selectedClassId, selectedDate]);

    const classOptions = classState.data ?? [];
    const classStudents = useMemo(
        () => (studentState.data ?? []).filter((student) => student.class_id === selectedClassId && student.status === "active"),
        [selectedClassId, studentState.data]
    );

    useEffect(() => {
        if (!selectedClassId || classStudents.length === 0) {
            setStatusByStudent({});
            return;
        }

        const nextStatusMap: Record<string, AttendanceStatus> = {};
        for (const student of classStudents) {
            nextStatusMap[student._id] = "present";
        }

        for (const row of attendanceState.data ?? []) {
            if (row.class_id === selectedClassId) {
                nextStatusMap[row.student_id] = row.status;
            }
        }

        setStatusByStudent(nextStatusMap);
    }, [attendanceState.data, classStudents, selectedClassId]);

    const markedCount = Object.keys(statusByStudent).length;
    const summaryCounts = useMemo(() => {
        const totals = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const status of Object.values(statusByStudent)) {
            totals[status] += 1;
        }
        return totals;
    }, [statusByStudent]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedClassId) {
            showToast("Select a class first.", "error");
            return;
        }

        if (classStudents.length === 0) {
            showToast("No active students found in this class.", "error");
            return;
        }

        setSaving(true);
        try {
            const payload: AttendanceBulkInput = {
                class_id: selectedClassId,
                date: selectedDate,
                records: classStudents.reduce<Record<string, AttendanceStatus>>((records, student) => {
                    records[student._id] = statusByStudent[student._id] ?? "present";
                    return records;
                }, {})
            };

            const result = await markAttendance(payload);
            if (!result.ok) {
                showToast(result.error.message || "Failed to save attendance", "error");
                return;
            }

            showToast(`Attendance saved for ${result.data.saved} students.`, "success");
            const refresh = await listAttendance({ class_id: selectedClassId, date: selectedDate });
            if (refresh.ok) {
                const refreshedMap: Record<string, AttendanceStatus> = {};
                for (const row of refresh.data) {
                    refreshedMap[row.student_id] = row.status;
                }
                setStatusByStudent((current) => ({ ...current, ...refreshedMap }));
            }
            onSaved?.();
        } finally {
            setSaving(false);
        }
    }

    if (classState.status === "loading" || studentState.status === "loading") {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (classState.status === "error") {
        return <DataState variant="error" title="Classes unavailable" message={classState.error} />;
    }

    if (studentState.status === "error") {
        return <DataState variant="error" title="Students unavailable" message={studentState.error} />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Class"
                    value={selectedClassId}
                    onChange={(event) => setSelectedClassId(event.target.value)}
                    options={[{ label: "Select class", value: "" }, ...classOptions.map((item) => ({ label: item.label, value: item.id }))]}
                />
                <Input
                    label="Date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                />
            </div>

            {selectedClassId ? (
                classStudents.length > 0 ? (
                    <div className="rounded-2xl border border-border bg-white overflow-hidden">
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 bg-slate-50">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Active students</p>
                                <p className="text-xs text-slate-500">Mark each student for {selectedDate}.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-200 px-2 py-1">Marked {markedCount}</span>
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Present {summaryCounts.present}</span>
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Late {summaryCounts.late}</span>
                            </div>
                        </div>
                        <div className="divide-y divide-border max-h-[480px] overflow-auto">
                            {classStudents.map((student, index) => {
                                const value = statusByStudent[student._id] ?? "present";
                                return (
                                    <div key={student._id} className={`grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_180px] ${index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900 truncate">{student.first_name} {student.last_name}</p>
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{student.admission_no}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Student ID: {student._id}</p>
                                        </div>
                                        <Select
                                            value={value}
                                            onChange={(event) => setStatusByStudent((current) => ({ ...current, [student._id]: event.target.value as AttendanceStatus }))}
                                            options={statusOptions.map((option) => ({ label: option.label, value: option.value }))}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <DataState
                        variant="empty"
                        title="No active students"
                        message="This class does not have any active enrollments yet."
                    />
                )
            ) : (
                <DataState
                    variant="empty"
                    title="Pick a class"
                    message="Select an assigned class to load its active students."
                />
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <Button type="submit" disabled={saving || !selectedClassId || classStudents.length === 0} className="min-w-[180px]">
                    {saving ? "Saving attendance..." : "Save attendance"}
                </Button>
            </div>
        </form>
    );
}
