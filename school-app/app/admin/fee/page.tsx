"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, DataTable, DataTableColumn, DataState, RowAction, Skeleton, TableSkeleton, Select, Input } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { serviceRequest } from "../../../services/service-client";
import { ClassFeeManagerDrawer } from "../../../modules/classes/components/ClassFeeManagerDrawer";

type ClassOption = { _id: string; name: string };
type SummaryResponse = {
    academic_year: string;
    total_students: number;
    total_fee_amount: number;
    collected: number;
    pending: number;
    collection_percentage: number;
    by_class: Array<{ class: string; students: number; total_fee: number; collected: number; percentage: number }>;
};
type AnalyticsResponse = {
    collection_trend: { monthly: Array<{ month: string; collected: number; percentage: number }> };
    payment_method_distribution: Record<string, number>;
    collection_by_class: Array<{ class: string; percentage: number; trend: string }>;
    top_defaulters: Array<{ student: string; pending: number; percentage_paid: number }>;
};
type DefaultersResponse = {
    defaulters: Array<{
        student_id: string;
        student_name: string;
        class: string;
        roll_no: string;
        total_pending: number;
        months_pending: string[];
        days_overdue: number;
        guardian_phone: string;
        guardian_email: string;
        percentage_paid: number;
    }>;
    total_defaulters: number;
    total_pending_amount: number;
};
type MonthlyFeeRow = {
    id: string;
    student_id: string;
    student_name: string;
    admission_no: string;
    guardian_phone: string;
    class_id: string;
    class: string;
    class_section: string;
    month: string;
    total_fee: number;
    paid: number;
    pending: number;
    status: string;
    due_date: string;
};
type MonthlyFeesResponse = {
    summary: { total_fees: number; collected: number; pending: number; collection_percentage: number };
    fees: MonthlyFeeRow[];
};
type PaymentsResponse = {
    payments: Array<{ receipt_no: string; student_name: string; amount: number; date: string; method: string; status: string }>;
};
type DailyResponse = {
    collection_date: string;
    total_collected: number;
    transaction_count: number;
    by_method: Record<string, number>;
};
type StudentLedgerResponse = {
    student: string;
    class: string;
    academic_year: string;
    fee_summary: { total_fee: number; paid: number; pending: number; percentage_paid: number; status: string };
    monthly_fees: Array<{ id: string; month: string; total: number; paid: number; pending: number; status: string; due_date: string }>;
    due_notices: Array<{ month: string; pending: number; due_date: string; days_overdue: number }>;
};
type ReceiptResponse = Record<string, unknown>;

const monthOptions = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function money(value: number) {
    return `Rs ${value.toLocaleString()}`;
}

function dateRangeForMonth(monthName: string, year: number) {
    const monthIndex = monthOptions.indexOf(monthName);
    const firstDay = new Date(year, monthIndex >= 0 ? monthIndex : new Date().getMonth(), 1);
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
    return {
        from: firstDay.toISOString().split("T")[0],
        to: lastDay.toISOString().split("T")[0],
    };
}

function currentMonthName() {
    return new Date().toLocaleString("en-US", { month: "long" });
}

export default function FeePage() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [defaulters, setDefaulters] = useState<DefaultersResponse | null>(null);
    const [monthlyLedger, setMonthlyLedger] = useState<MonthlyFeeRow[]>([]);
    const [payments, setPayments] = useState<PaymentsResponse["payments"]>([]);
    const [daily, setDaily] = useState<DailyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(currentMonthName());
    const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedReceiptNo, setSelectedReceiptNo] = useState("");
    const [selectedClassForFee, setSelectedClassForFee] = useState<ClassOption | null>(null);
    const [studentLedger, setStudentLedger] = useState<StudentLedgerResponse | null>(null);
    const [receiptDetails, setReceiptDetails] = useState<ReceiptResponse | null>(null);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const result = await serviceRequest<{ data?: ClassOption[]; classes?: ClassOption[]; rows?: ClassOption[]; items?: ClassOption[] } | ClassOption[]>("/api/classes");
                if (!cancelled && result.ok) {
                    const list = Array.isArray(result.data)
                        ? result.data
                        : (result.data?.classes ?? result.data?.rows ?? result.data?.items ?? result.data?.data ?? []);
                    setClasses(list.map((row: any) => ({ _id: String(row._id ?? row.id), name: String(row.name ?? "Unnamed Class") })));
                }
            } catch {
                if (!cancelled) setClasses([]);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        void (async () => {
            try {
                const year = Number(selectedYear);
                const { from, to } = dateRangeForMonth(selectedMonth, year);

                const [summaryRes, analyticsRes, defaultersRes, ledgerRes, paymentsRes, dailyRes] = await Promise.all([
                    serviceRequest<SummaryResponse>(`/api/school/fees/summary`),
                    serviceRequest<AnalyticsResponse>(`/api/school/fees/analytics${selectedClassId ? `?class_id=${selectedClassId}` : ""}`),
                    serviceRequest<DefaultersResponse>(`/api/school/fees/defaulters${selectedClassId ? `?class_id=${selectedClassId}` : ""}`),
                    serviceRequest<MonthlyFeesResponse>(`/api/school/fees${new URLSearchParams({ class_id: selectedClassId, month: selectedMonth, year: String(year), status: statusFilter === "all" ? "" : statusFilter, page: "1", limit: "200" }).toString() ? `?${new URLSearchParams({ class_id: selectedClassId, month: selectedMonth, year: String(year), status: statusFilter === "all" ? "" : statusFilter, page: "1", limit: "200" }).toString()}` : ""}`),
                    serviceRequest<PaymentsResponse>(`/api/school/fees/payments?date_from=${from}&date_to=${to}${paymentMethodFilter !== "all" ? `&method=${paymentMethodFilter}` : ""}`),
                    serviceRequest<DailyResponse>(`/api/school/fees/payments/daily?date=${new Date().toISOString().split("T")[0]}`),
                ]);

                if (cancelled) return;
                if (!summaryRes.ok) throw new Error(summaryRes.error.message || "Failed to load fee summary");
                if (!analyticsRes.ok) throw new Error(analyticsRes.error.message || "Failed to load fee analytics");
                if (!defaultersRes.ok) throw new Error(defaultersRes.error.message || "Failed to load defaulters");
                if (!ledgerRes.ok) throw new Error(ledgerRes.error.message || "Failed to load fee ledger");
                if (!paymentsRes.ok) throw new Error(paymentsRes.error.message || "Failed to load payments");
                if (!dailyRes.ok) throw new Error(dailyRes.error.message || "Failed to load daily collection");

                setSummary(summaryRes.data);
                setAnalytics(analyticsRes.data);
                setDefaulters(defaultersRes.data);
                setMonthlyLedger(ledgerRes.data?.fees ?? []);
                setPayments(paymentsRes.data?.payments ?? []);
                setDaily(dailyRes.data);
            } catch (caught) {
                if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load fee dashboard");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [paymentMethodFilter, selectedClassId, selectedMonth, selectedYear, statusFilter]);

    useEffect(() => {
        if (!selectedStudentId) {
            setStudentLedger(null);
            return;
        }

        let cancelled = false;
        void (async () => {
            const result = await serviceRequest<StudentLedgerResponse>(`/api/school/fees/student/${selectedStudentId}`);
            if (!cancelled && result.ok) {
                setStudentLedger(result.data);
                const paymentResult = await serviceRequest<PaymentsResponse>(`/api/school/fees/payments?student_id=${selectedStudentId}`);
                if (!cancelled && paymentResult.ok) {
                    setPayments(paymentResult.data?.payments ?? []);
                    const firstReceipt = paymentResult.data?.payments?.[0]?.receipt_no ?? "";
                    setSelectedReceiptNo(firstReceipt);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [selectedStudentId]);

    useEffect(() => {
        if (!selectedReceiptNo) {
            setReceiptDetails(null);
            return;
        }

        let cancelled = false;
        void (async () => {
            const result = await serviceRequest<ReceiptResponse>(`/api/school/fees/payments/receipt/${selectedReceiptNo}`);
            if (!cancelled && result.ok) {
                setReceiptDetails(result.data);
            }
        })();

        return () => { cancelled = true; };
    }, [selectedReceiptNo]);

    const visibleLedgerRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return monthlyLedger.filter((row) => {
            const matchesSearch = q.length === 0
                || row.student_name.toLowerCase().includes(q)
                || row.admission_no.toLowerCase().includes(q)
                || row.guardian_phone.toLowerCase().includes(q)
                || row.class.toLowerCase().includes(q);
            const matchesStatus = statusFilter === "all" ? true : row.status === statusFilter || (statusFilter === "overdue" && row.status !== "paid" && new Date(row.due_date) < new Date());
            return matchesSearch && matchesStatus;
        });
    }, [monthlyLedger, searchQuery, statusFilter]);

    const todayCollection = daily?.total_collected ?? 0;
    const monthCollection = payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const pendingDues = summary?.pending ?? 0;
    const overdueAmount = defaulters?.total_pending_amount ?? 0;
    const collectionRate = summary?.collection_percentage ?? 0;
    const studentsPending = defaulters?.total_defaulters ?? 0;
    const paidThisMonth = payments.length;

    const columns: DataTableColumn<MonthlyFeeRow>[] = useMemo(() => [
        {
            key: "student",
            label: "Student",
            render: (row) => (
                <button
                    type="button"
                    onClick={() => setSelectedStudentId(row.student_id)}
                    className="flex items-center gap-3 text-left"
                >
                    <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-black">
                        {row.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none">{row.student_name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{row.guardian_phone || row.admission_no}</p>
                    </div>
                </button>
            ),
        },
        { key: "admission_no", label: "Admission ID", render: (row) => <span className="text-sm font-semibold text-slate-600">{row.admission_no}</span> },
        { key: "class", label: "Class", render: (row) => <span className="text-sm font-semibold text-slate-600">{row.class}{row.class_section ? `-${row.class_section}` : ""}</span> },
        { key: "month", label: "Month", render: (row) => <span className="text-sm font-semibold text-slate-600">{row.month}</span> },
        { key: "due_date", label: "Due Date", render: (row) => <span className="text-sm font-semibold text-slate-600">{row.due_date}</span> },
        { key: "total", label: "Total", render: (row) => <span className="font-black text-slate-900">{money(row.total_fee)}</span> },
        { key: "paid", label: "Paid", render: (row) => <span className="font-black text-emerald-600">{money(row.paid)}</span> },
        { key: "remaining", label: "Remaining", render: (row) => <span className="font-black text-amber-600">{money(row.pending)}</span> },
        {
            key: "status",
            label: "Status",
            render: (row) => (
                <Badge variant={row.status === "paid" ? "success" : row.status === "partial" ? "warning" : "error"}>
                    {row.status}
                </Badge>
            ),
        },
    ], []);

    const rowActions: RowAction<MonthlyFeeRow>[] = useMemo(() => [
        {
            icon: "add_card",
            label: "Collect Fee",
            variant: "primary",
            onClick: (row) => setSelectedStudentId(row.student_id),
        },
        {
            icon: "account_balance_wallet",
            label: "Open Ledger",
            variant: "ghost",
            onClick: (row) => setSelectedStudentId(row.student_id),
        },
        {
            icon: "receipt_long",
            label: "View Receipt",
            variant: "ghost",
            onClick: (row) => {
                setSelectedStudentId(row.student_id);
                setSelectedReceiptNo(payments.find((payment) => payment.student_name.toLowerCase().includes(row.student_name.toLowerCase()))?.receipt_no || selectedReceiptNo);
            },
        },
        {
            icon: "history",
            label: "Payment History",
            variant: "ghost",
            onClick: (row) => setSelectedStudentId(row.student_id),
        },
        {
            icon: "notifications",
            label: "Send Reminder",
            variant: "ghost",
            showIf: (row) => row.pending > 0,
            onClick: (row) => setSelectedStudentId(row.student_id),
        },
        {
            icon: "payments",
            label: "Edit Charges",
            variant: "ghost",
            onClick: (row) => {
                const match = classes.find((item) => item._id === row.class_id);
                if (match) setSelectedClassForFee(match);
            },
        },
    ], [classes, payments, selectedReceiptNo]);

    const openReceiptPreview = (receiptNo?: string) => {
        if (receiptNo) setSelectedReceiptNo(receiptNo);
    };

    const selectedClassForFeeItem = selectedClassForFee ?? (selectedClassId ? classes.find((item) => item._id === selectedClassId) ?? null : null);

    return (
        <SchoolShell title="Fee Management ERP" eyebrow="Finance">
            <div className="space-y-8 pb-10 min-h-[80vh]">
                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
                            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-3xl" />)}
                        </div>
                        <Skeleton className="h-16 rounded-2xl" />
                        <TableSkeleton />
                    </div>
                ) : error ? (
                    <DataState variant="error" title="Fee dashboard unavailable" message={error} />
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                            {[
                                { label: "Today's Collection", value: money(todayCollection), icon: "today", tone: "blue" },
                                { label: "Monthly Collection", value: money(monthCollection), icon: "payments", tone: "emerald" },
                                { label: "Pending Dues", value: money(pendingDues), icon: "pending_actions", tone: "amber" },
                                { label: "Overdue Amount", value: money(overdueAmount), icon: "warning", tone: "red" },
                                { label: "Collection Rate", value: `${collectionRate}%`, icon: "analytics", tone: "violet" },
                                { label: "Students Pending", value: String(studentsPending), icon: "groups", tone: "slate" },
                                { label: "Paid This Month", value: String(paidThisMonth), icon: "receipt_long", tone: "blue" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">{stat.value}</p>
                                    </div>
                                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center bg-${stat.tone}-50 text-${stat.tone}-600`}>
                                        <span className="material-symbols-outlined text-[22px]">{stat.icon}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sticky top-[72px] z-20">
                            <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
                                <div className="relative xl:col-span-2">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search student, admission id, guardian number..."
                                        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
                                    />
                                </div>
                                <Select
                                    value={selectedClassId}
                                    onChange={(event) => setSelectedClassId(event.target.value)}
                                    options={[{ label: "All classes", value: "" }, ...classes.map((item) => ({ label: item.name, value: item._id }))]}
                                />
                                <Select
                                    value={selectedMonth}
                                    onChange={(event) => setSelectedMonth(event.target.value)}
                                    options={monthOptions.map((month) => ({ label: month, value: month }))}
                                />
                                <Input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(event) => setSelectedYear(event.target.value)}
                                    placeholder="Year"
                                />
                                <Select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    options={[
                                        { label: "Fee status: All", value: "all" },
                                        { label: "Paid", value: "paid" },
                                        { label: "Partial", value: "partial" },
                                        { label: "Pending", value: "unpaid" },
                                        { label: "Overdue", value: "overdue" },
                                    ]}
                                />
                                <Select
                                    value={paymentMethodFilter}
                                    onChange={(event) => setPaymentMethodFilter(event.target.value)}
                                    options={[
                                        { label: "Payment method: All", value: "all" },
                                        { label: "Cash", value: "cash" },
                                        { label: "Bank Transfer", value: "bank_transfer" },
                                        { label: "Card", value: "card" },
                                        { label: "Online", value: "online" },
                                        { label: "JazzCash", value: "jazzcash" },
                                        { label: "EasyPaisa", value: "easypaisa" },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
                            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <DataTable
                                    columns={columns}
                                    rows={visibleLedgerRows}
                                    rowKey={(row) => row.id}
                                    sortable
                                    paginated={25}
                                    rowActions={rowActions}
                                    emptyState={{
                                        title: "No ledger entries found",
                                        description: "Try a different class, month, or status filter.",
                                    }}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Collection trend</p>
                                            <h3 className="mt-1 text-lg font-black text-slate-900">Monthly collection</h3>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {(analytics?.collection_trend.monthly ?? []).slice(-6).map((point) => (
                                            <div key={point.month} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-slate-800">{point.month}</p>
                                                    <p className="text-sm font-black text-slate-900">{money(point.collected)}</p>
                                                </div>
                                                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                                                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, point.percentage || 0)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Defaulters</p>
                                        <h3 className="mt-1 text-lg font-black text-slate-900">Overdue accounts</h3>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {(defaulters?.defaulters ?? []).slice(0, 6).map((row) => (
                                            <button key={row.student_id} type="button" onClick={() => setSelectedStudentId(row.student_id)} className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{row.student_name}</p>
                                                        <p className="text-xs text-slate-500">{row.class} · {row.roll_no}</p>
                                                    </div>
                                                    <Badge variant="error">{money(row.total_pending)}</Badge>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-slate-500">{row.days_overdue} days overdue · {row.months_pending.join(", ")}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment channels</p>
                                        <h3 className="mt-1 text-lg font-black text-slate-900">Method distribution</h3>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        {Object.entries(analytics?.payment_method_distribution ?? {}).map(([method, count]) => (
                                            <div key={method} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                                                <p className="text-sm font-semibold text-slate-700">{method}</p>
                                                <p className="text-sm font-black text-slate-900">{count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Class summary</p>
                                <div className="mt-4 space-y-3">
                                    {(summary?.by_class ?? []).map((item) => (
                                        <div key={item.class} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900">{item.class}</p>
                                                <p className="text-sm font-black text-slate-900">{item.percentage}%</p>
                                            </div>
                                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                                                <span>Students {item.students}</span>
                                                <span>Total {money(item.total_fee)}</span>
                                                <span>Collected {money(item.collected)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Top defaulters</p>
                                <div className="mt-4 space-y-3">
                                    {(analytics?.top_defaulters ?? []).map((item) => (
                                        <div key={item.student} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900">{item.student}</p>
                                                <p className="text-sm font-black text-red-600">{money(item.pending)}</p>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{item.percentage_paid}% paid</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ClassFeeManagerDrawer
                isOpen={selectedClassForFeeItem !== null}
                classItem={selectedClassForFeeItem}
                onClose={() => setSelectedClassForFee(null)}
            />

            <div className={`fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-[2px] transition ${selectedStudentId ? "opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setSelectedStudentId("")} />
            <aside className={`fixed inset-y-0 right-0 z-[10001] w-full max-w-5xl bg-white shadow-[-30px_0_70px_-20px_rgba(15,23,42,0.35)] transition-transform ${selectedStudentId ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">Student Ledger</p>
                        <h2 className="mt-1 text-xl font-black text-slate-900">{studentLedger?.student || "Ledger timeline"}</h2>
                        <p className="text-xs font-semibold text-slate-500">{studentLedger?.class || ""} · {studentLedger?.academic_year || ""}</p>
                    </div>
                    <button onClick={() => { setSelectedStudentId(""); setSelectedReceiptNo(""); }} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="grid h-[calc(100%-78px)] gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="overflow-y-auto p-6 bg-[#FBFCFF]">
                        <div className="grid gap-4 md:grid-cols-4">
                            {[
                                ["Total", studentLedger?.fee_summary.total_fee ?? 0],
                                ["Paid", studentLedger?.fee_summary.paid ?? 0],
                                ["Pending", studentLedger?.fee_summary.pending ?? 0],
                                ["Paid %", `${studentLedger?.fee_summary.percentage_paid ?? 0}%`],
                            ].map(([label, value]) => (
                                <div key={label as string} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">{typeof value === "number" ? money(value) : value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Month-wise ledger</p>
                                    <h3 className="text-lg font-black text-slate-900">Charges and carry-forward</h3>
                                </div>
                                <Badge variant={studentLedger?.fee_summary.status === "paid" ? "success" : "warning"}>{studentLedger?.fee_summary.status}</Badge>
                            </div>
                            <div className="mt-4 space-y-3">
                                {studentLedger?.monthly_fees?.map((fee) => (
                                    <div key={fee.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">{fee.month}</p>
                                            <Badge variant={fee.status === "paid" ? "success" : fee.status === "partial" ? "warning" : "error"}>{fee.status}</Badge>
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                                            <div><p className="text-slate-400 text-xs">Total</p><p className="font-black text-slate-900">{money(fee.total)}</p></div>
                                            <div><p className="text-slate-400 text-xs">Paid</p><p className="font-black text-emerald-600">{money(fee.paid)}</p></div>
                                            <div><p className="text-slate-400 text-xs">Remaining</p><p className="font-black text-amber-600">{money(fee.pending)}</p></div>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Due {fee.due_date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Overdue notices</p>
                            <div className="mt-4 space-y-3">
                                {studentLedger?.due_notices?.length ? studentLedger.due_notices.map((notice) => (
                                    <div key={`${notice.month}-${notice.due_date}`} className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">{notice.month}</p>
                                            <p className="text-sm font-black text-red-600">{money(notice.pending)}</p>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">{notice.days_overdue} days overdue · Due {notice.due_date}</p>
                                    </div>
                                )) : <p className="text-sm text-slate-500">No overdue entries.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto border-l border-slate-200 p-6">
                        <div className="rounded-3xl border border-slate-200 bg-[#0F172A] p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Receipt preview</p>
                                    <h3 className="mt-1 text-lg font-black">{selectedReceiptNo || "No receipt selected"}</h3>
                                </div>
                                <button onClick={() => window.print()} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-white/20">
                                    Print / PDF
                                </button>
                            </div>
                            <div className="mt-5 space-y-3 text-sm text-slate-200">
                                {receiptDetails ? (
                                    <>
                                        <div className="rounded-2xl bg-white/10 p-3">
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300">Receipt</p>
                                            <p className="mt-1 font-black text-white">{String(receiptDetails.receipt_no ?? selectedReceiptNo)}</p>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-slate-300">Student</p><p className="font-bold text-white">{String((receiptDetails as any).student_id?.first_name ?? studentLedger?.student ?? "")}</p></div>
                                            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-slate-300">Class</p><p className="font-bold text-white">{String((receiptDetails as any).class_id?.name ?? studentLedger?.class ?? "")}</p></div>
                                            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-slate-300">Amount</p><p className="font-black text-white">{money(Number((receiptDetails as any).amount ?? 0))}</p></div>
                                            <div className="rounded-2xl bg-white/10 p-3"><p className="text-xs text-slate-300">Method</p><p className="font-bold text-white">{String((receiptDetails as any).payment_method ?? "")}</p></div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-300">Select a receipt from payment history to preview it here.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payment history</p>
                                    <h3 className="mt-1 text-lg font-black text-slate-900">Recent collections</h3>
                                </div>
                                <Badge variant="secondary">{studentLedger?.fee_summary.status ?? "open"}</Badge>
                            </div>
                            <div className="mt-4 space-y-3">
                                {payments.filter((payment) => !selectedStudentId || payment.student_name.toLowerCase().includes((studentLedger?.student || "").toLowerCase())).slice(0, 8).map((payment) => (
                                    <button key={payment.receipt_no} type="button" onClick={() => openReceiptPreview(payment.receipt_no)} className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900">{payment.receipt_no}</p>
                                                <p className="text-xs text-slate-500">{payment.date} · {payment.method}</p>
                                            </div>
                                            <p className="font-black text-slate-900">{money(payment.amount)}</p>
                                        </div>
                                    </button>
                                ))}
                                {!payments.length && <p className="text-sm text-slate-500">No payment history found.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </SchoolShell>
    );
}