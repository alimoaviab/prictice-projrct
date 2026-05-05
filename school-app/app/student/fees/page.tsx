"use client";

import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";

type FeesResponse = {
    student: string;
    class: string;
    academic_year: string;
    fee_summary: {
        total_fee: number;
        collected: number;
        pending: number;
        percentage_paid: number;
        status: string;
    };
    fee_details: Array<{
        fee_type: string;
        amount: number;
        due_date: string;
        status: string;
        payment_date: string | null;
        receipt_no: string | null;
    }>;
    payment_history: Array<{
        receipt_no: string;
        date: string;
        amount: number;
        fee_type: string;
        method: string;
        status: string;
    }>;
};

async function resolveStudentId(studentId?: string) {
    if (studentId) return studentId;
    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

export default function StudentFeesPage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<FeesResponse>();

    useEffect(() => {
        void run(async () => {
            const studentId = await resolveStudentId(user?.studentId);
            if (!studentId) throw new Error("No linked student found.");

            const result = await serviceRequest<FeesResponse>(`/api/parent/fees?student_id=${studentId}`);
            if (!result.ok) throw new Error(result.error.message || "Failed to load fees");
            return result.data;
        }).catch(() => {
            // handled by useSafeAsync
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Fees">
                <div className="space-y-4">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error") {
        return (
            <SchoolShell eyebrow="Student Portal" title="Fees">
                <DataState variant="error" title="Fee information unavailable" message={state.error} />
            </SchoolShell>
        );
    }

    const report = state.data;

    return (
        <SchoolShell eyebrow="Student Portal" title="Fees">
            <div className="space-y-6">
                <Card>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{report.student}</h2>
                            <p className="text-sm text-slate-500">{report.class} · {report.academic_year}</p>
                        </div>
                        <Badge variant={report.fee_summary.pending > 0 ? "warning" : "success"}>
                            {report.fee_summary.status}
                        </Badge>
                    </div>
                    <div className="mt-6 grid gap-3 md:grid-cols-4">
                        {[
                            ["Total Fee", report.fee_summary.total_fee],
                            ["Collected", report.fee_summary.collected],
                            ["Pending", report.fee_summary.pending],
                            ["Paid %", `${report.fee_summary.percentage_paid}%`]
                        ].map(([label, value]) => (
                            <div key={label as string} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <h3 className="text-lg font-bold text-slate-900">Fee breakdown</h3>
                        <div className="mt-4 space-y-3">
                            {report.fee_details.map((fee) => (
                                <div key={`${fee.fee_type}-${fee.due_date}`} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold text-slate-900">{fee.fee_type}</p>
                                        <Badge variant={fee.status === "paid" ? "success" : fee.status === "partial" ? "warning" : "error"}>{fee.status}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Amount {fee.amount.toLocaleString()} · Due {fee.due_date}
                                    </p>
                                    <p className="text-xs text-slate-400">{fee.receipt_no ? `Receipt ${fee.receipt_no}` : "No receipt yet"}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold text-slate-900">Payment history</h3>
                        <div className="mt-4 space-y-3">
                            {report.payment_history.length ? report.payment_history.map((payment) => (
                                <div key={payment.receipt_no} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{payment.receipt_no}</p>
                                            <p className="text-xs text-slate-500">{payment.date} · {payment.method}</p>
                                        </div>
                                        <p className="font-bold text-slate-900">Rs {payment.amount.toLocaleString()}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">{payment.fee_type}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No payments recorded yet.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </SchoolShell>
    );
}