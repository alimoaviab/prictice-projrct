"use client";

import { useMemo, useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { DataTable, DataTableColumn, Badge, DataState, RowAction } from "../../../components/ui";

interface FeeRecord {
    _id: string;
    student_name: string;
    admission_no: string;
    class: string;
    amount: number;
    due_date: string;
    status: "paid" | "pending" | "overdue";
}

export default function FeePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");

    // Mock data for premium demonstration
    const data: FeeRecord[] = useMemo(() => [
        { _id: "1", student_name: "Alex Johnson", admission_no: "ADM-001", class: "Grade 10-A", amount: 1250, due_date: "2024-05-15", status: "paid" },
        { _id: "2", student_name: "Sarah Williams", admission_no: "ADM-042", class: "Grade 10-B", amount: 1250, due_date: "2024-05-20", status: "pending" },
        { _id: "3", student_name: "Michael Chen", admission_no: "ADM-089", class: "Grade 11-A", amount: 1500, due_date: "2024-05-01", status: "overdue" },
        { _id: "4", student_name: "Emma Davis", admission_no: "ADM-112", class: "Grade 9-C", amount: 1100, due_date: "2024-05-18", status: "pending" },
        { _id: "5", student_name: "James Wilson", admission_no: "ADM-205", class: "Grade 12-B", amount: 1800, due_date: "2024-04-25", status: "overdue" },
    ], []);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return data.filter((row) => {
            const queryMatch = q.length === 0 || 
                row.student_name.toLowerCase().includes(q) || 
                row.admission_no.toLowerCase().includes(q);
            const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
            return queryMatch && statusMatch;
        });
    }, [data, searchQuery, statusFilter]);

    const stats = useMemo(() => ({
        total: "$124,500",
        collected: "$98,200",
        pending: "$26,300",
        collectionRate: "78.8%"
    }), []);

    const columns: DataTableColumn<FeeRecord>[] = useMemo(() => [
        {
            key: "student",
            label: "Student identity",
            render: (row: FeeRecord) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black uppercase">
                        {row.student_name.substring(0, 2)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none mb-1">{row.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.admission_no}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "class",
            label: "Academic Unit",
            render: (row: FeeRecord) => <span className="text-[11px] font-bold text-slate-600">{row.class}</span>,
        },
        {
            key: "amount",
            label: "Balance",
            render: (row: FeeRecord) => <span className="text-[11px] font-black text-slate-900">${row.amount.toLocaleString()}</span>,
        },
        {
            key: "due_date",
            label: "Deadline",
            render: (row: FeeRecord) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.due_date}</span>,
        },
        {
            key: "status",
            label: "Collection State",
            render: (row: FeeRecord) => (
                <Badge
                    variant={row.status === "paid" ? "success" : row.status === "overdue" ? "error" : "warning"}
                    className="capitalize text-[9px] font-black uppercase tracking-widest px-2"
                >
                    {row.status}
                </Badge>
            ),
        },
    ], []);

    const rowActions: RowAction<FeeRecord>[] = useMemo(() => [
        {
            icon: "receipt_long",
            label: "Generate Receipt",
            variant: "primary",
            onClick: (row: FeeRecord) => alert(`Receipt for ${row.student_name}`),
        },
        {
            icon: "mail",
            label: "Send Reminder",
            variant: "ghost",
            showIf: (row: FeeRecord) => row.status !== "paid",
            onClick: (row: FeeRecord) => alert(`Reminder sent to ${row.student_name}`),
        },
    ], []);

    return (
        <SchoolShell title="Revenue Hub" eyebrow="Finance">
            <div className="space-y-8 relative min-h-[80vh] pb-10">
                {/* Stats Section - Premium & Financial */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Gross Revenue", value: stats.total, icon: "account_balance_wallet", color: "text-blue-600", bg: "bg-blue-600/5" },
                        { label: "Net Collection", value: stats.collected, icon: "payments", color: "text-emerald-600", bg: "bg-emerald-600/5" },
                        { label: "Pending Dues", value: stats.pending, icon: "pending_actions", color: "text-amber-600", bg: "bg-amber-600/5" },
                        { label: "Collection Index", value: stats.collectionRate, icon: "analytics", color: "text-purple-600", bg: "bg-purple-600/5" },
                    ].map((stat, i) => (
                        <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-default">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{stat.value}</h3>
                            </div>
                            <div className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                <span className="material-symbols-outlined text-lg font-black">{stat.icon}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar Section - Unified & Sticky */}
                <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md sticky top-[72px] z-20 border-slate-200/60 shadow-sm rounded-xl">
                    <div className="flex flex-1 items-center gap-2 max-w-2xl">
                        <div className="relative flex-1">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search student name or admission ID..."
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-600/5 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-emerald-400"
                        >
                            <option value="all">Lifecycle: All</option>
                            <option value="paid">Settled Accounts</option>
                            <option value="pending">Awaiting Payment</option>
                            <option value="overdue">Overdue / Priority</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
                            {filteredRows.length} <span className="text-slate-400">LEDGER ENTRIES</span>
                        </span>
                        <div className="h-6 w-px bg-slate-200" />
                        <button
                            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">add_card</span>
                            New Payment
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
                    <DataTable
                        columns={columns}
                        rows={filteredRows}
                        rowKey={(row) => row._id}
                        sortable
                        paginated={10}
                        rowActions={rowActions}
                        emptyState={{
                            title: "No Payment Records Found",
                            description: "Try refining your search parameters or add a new collection."
                        }}
                    />
                </div>

                {/* Pagination Footer - Premium ERP Style */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-emerald-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{data.length}</span> Ledgers
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="h-9 w-9 rounded-xl bg-emerald-600 text-[10px] font-black text-white shadow-lg shadow-emerald-600/20">1</button>
                        </div>
                        <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                            Next
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </SchoolShell>
    );
}