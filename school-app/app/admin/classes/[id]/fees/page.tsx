"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DataState, Skeleton, Badge } from "../../../../../components/ui";
import { SchoolShell } from "../../../../../layouts/SchoolShell";
import { serviceRequest } from "../../../../../services/service-client";

type FeeComponent = {
    id: string;
    fee_type_id: string;
    fee_type: string;
    amount: number;
    due_date: string;
    billing_mode: "recurring_monthly" | "recurring_quarterly" | "recurring_yearly" | "onetime";
    notes: string;
    status: string;
};

type StudentFee = {
    id: string;
    student_id: string;
    student_name: string;
    admission_no: string;
    current_month_due: number;
    paid_amount: number;
    remaining_balance: number;
    status: "paid" | "partial" | "unpaid" | "overdue";
    last_payment_date: string | null;
};

type ClassFeeData = {
    class_id: string;
    class_name: string;
    section: string;
    academic_year: string;
    total_students: number;
    total_monthly_revenue: number;
    pending_dues: number;
    collection_percentage: number;
    fee_components: FeeComponent[];
    students: StudentFee[];
};

function money(value: number) {
    return `Rs ${value.toLocaleString()}`;
}

export default function ClassFeesPage() {
    const params = useParams();
    const router = useRouter();
    const classId = params.id as string;

    const [data, setData] = useState<ClassFeeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        amount: "",
        due_date: "",
        billing_mode: "recurring_monthly" as const,
        notes: ""
    });

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        void (async () => {
            try {
                const result = await serviceRequest<ClassFeeData>(`/api/classes/${classId}/fees`);

                if (cancelled) return;

                if (!result.ok) {
                    throw new Error(result.error.message || "Failed to load class fees");
                }

                setData(result.data);
            } catch (caught) {
                if (!cancelled) {
                    setError(caught instanceof Error ? caught.message : "Unable to load class fees");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [classId]);

    const handleCreateComponent = async () => {
        try {
            const result = await serviceRequest(`/api/classes/${classId}/fees/components`, {
                method: "POST",
                body: JSON.stringify({
                    amount: Number(formData.amount),
                    due_date: formData.due_date,
                    billing_mode: formData.billing_mode,
                    notes: formData.notes
                })
            });

            if (result.ok) {
                // Reload data
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to create fee component:", error);
        }
    };

    const handleCollectFee = (studentId: string) => {
        router.push(`/admin/students/${studentId}/fees/collect`);
    };

    const handleOpenLedger = (studentId: string) => {
        router.push(`/admin/students/${studentId}/fees/ledger`);
    };

    if (loading) {
        return (
            <SchoolShell title="Fee Management" eyebrow="Loading...">
                <div className="space-y-4">
                    <Skeleton className="h-20 rounded-2xl" />
                    <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </SchoolShell>
        );
    }

    if (error || !data) {
        return (
            <SchoolShell title="Fee Management" eyebrow="Error">
                <DataState variant="error" title="Failed to load fees" message={error} />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell 
            title={`${data.class_name} Fee Management`} 
            eyebrow="Finance"
            actions={
                <button
                    type="button"
                    onClick={() => router.push("/admin/fee")}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back to Dashboard
                </button>
            }
        >
            <div className="flex gap-6">
                {/* MAIN CONTENT AREA */}
                <div className="flex-1 space-y-6">
                    {/* STICKY PROFESSIONAL FINANCE HEADER */}
                    <div className="sticky top-[72px] z-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Class</p>
                                    <p className="text-lg font-black text-slate-900">{data.class_name}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Academic Year</p>
                                    <p className="text-sm font-bold text-slate-700">{data.academic_year}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Total Students</p>
                                    <p className="text-sm font-bold text-slate-700">{data.total_students}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Monthly Revenue</p>
                                    <p className="text-sm font-bold text-emerald-600">{money(data.total_monthly_revenue)}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Pending Dues</p>
                                    <p className="text-sm font-bold text-amber-600">{money(data.pending_dues)}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200" />
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Collection</p>
                                    <p className="text-sm font-bold text-blue-600">{data.collection_percentage}%</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                        viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-100"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                                        viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-100"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">view_list</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FEE COMPONENTS SECTION */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-900">Fee Components</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Component
                            </button>
                        </div>

                        {data.fee_components.length === 0 ? (
                            <DataState
                                variant="empty"
                                title="No fee components"
                                message="Add recurring or one-time fee components to start billing"
                            />
                        ) : (
                            <div className="space-y-2">
                                {data.fee_components.map((component) => (
                                    <div
                                        key={component.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                                <span className="material-symbols-outlined text-[20px] text-blue-600">
                                                    {component.billing_mode.startsWith("recurring") ? "autorenew" : "receipt"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{component.fee_type}</p>
                                                <p className="text-xs text-slate-500">
                                                    {component.billing_mode.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())} · Due: {component.due_date}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-lg font-black text-slate-900">{money(component.amount)}</p>
                                            <button
                                                type="button"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-600"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-600"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* STUDENTS SECTION */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="mb-4 text-base font-black text-slate-900">Student Fees</h3>

                        {data.students.length === 0 ? (
                            <DataState
                                variant="empty"
                                title="No students found"
                                message="Add students to this class to manage their fees"
                            />
                        ) : viewMode === "grid" ? (
                            <div className="grid grid-cols-3 gap-4">
                                {data.students.map((student) => (
                                    <div
                                        key={student.id}
                                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900">{student.student_name}</p>
                                                <p className="text-xs text-slate-500">{student.admission_no}</p>
                                            </div>
                                            <Badge
                                                variant={
                                                    student.status === "paid" ? "success" :
                                                    student.status === "partial" ? "warning" :
                                                    student.status === "overdue" ? "error" : "gray"
                                                }
                                            >
                                                {student.status}
                                            </Badge>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Current Due</span>
                                                <span className="font-bold text-slate-900">{money(student.current_month_due)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Paid</span>
                                                <span className="font-bold text-emerald-600">{money(student.paid_amount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-600">Balance</span>
                                                <span className="font-bold text-amber-600">{money(student.remaining_balance)}</span>
                                            </div>
                                        </div>

                                        {student.last_payment_date && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Last payment: {student.last_payment_date}
                                            </p>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleCollectFee(student.student_id)}
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">add_card</span>
                                                Collect
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenLedger(student.student_id)}
                                                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                                                Ledger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Student</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Admission No</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Current Due</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Balance</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-600">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {data.students.map((student) => (
                                            <tr key={student.id} className="transition hover:bg-slate-50">
                                                <td className="px-4 py-3">
                                                    <p className="font-bold text-slate-900">{student.student_name}</p>
                                                    {student.last_payment_date && (
                                                        <p className="text-xs text-slate-500">Last: {student.last_payment_date}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">{student.admission_no}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-900">{money(student.current_month_due)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">{money(student.paid_amount)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-amber-600">{money(student.remaining_balance)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge
                                                        variant={
                                                            student.status === "paid" ? "success" :
                                                            student.status === "partial" ? "warning" :
                                                            student.status === "overdue" ? "error" : "gray"
                                                        }
                                                    >
                                                        {student.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCollectFee(student.student_id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                                                            title="Collect Fee"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">add_card</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenLedger(student.student_id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                                                            title="Open Ledger"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                                                            title="Print Receipt"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">print</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
                                                            title="Send Reminder"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">notifications</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE QUICK PANEL */}
                <div className="w-80 space-y-4">
                    {/* QUICK CREATE PANEL */}
                    {showCreateForm && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h4 className="text-sm font-black text-slate-900">Add Fee Component</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Amount</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Billing Mode</label>
                                    <select
                                        value={formData.billing_mode}
                                        onChange={(e) => setFormData({ ...formData, billing_mode: e.target.value as any })}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                                    >
                                        <option value="recurring_monthly">Recurring Monthly</option>
                                        <option value="recurring_quarterly">Recurring Quarterly</option>
                                        <option value="recurring_yearly">Recurring Yearly</option>
                                        <option value="onetime">One-Time</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold text-slate-700">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Optional notes"
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCreateComponent}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Create Component
                                </button>
                            </div>
                        </div>
                    )}

                    {/* RECENT COMPONENTS */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">Recent Components</h4>
                        <div className="space-y-2">
                            {data.fee_components.slice(0, 5).map((component) => (
                                <div key={component.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                                    <p className="text-sm font-bold text-slate-900">{component.fee_type}</p>
                                    <p className="text-xs text-slate-500">{money(component.amount)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SchoolShell>
    );
}
