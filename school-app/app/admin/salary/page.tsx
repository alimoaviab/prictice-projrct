"use client";

import { useMemo, useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { DataTable, DataTableColumn, Badge, DataState, RowAction } from "../../../components/ui";

interface SalaryRecord {
    _id: string;
    staff_name: string;
    employee_id: string;
    position: string;
    base_salary: number;
    allowances: number;
    status: "disbursed" | "pending" | "processing";
    month: string;
}

export default function SalaryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "disbursed" | "pending" | "processing">("all");

    // Mock data for premium demonstration
    const data: SalaryRecord[] = useMemo(() => [
        { _id: "1", staff_name: "Dr. Robert Smith", employee_id: "EMP-101", position: "Senior Faculty", base_salary: 4500, allowances: 500, status: "disbursed", month: "May 2024" },
        { _id: "2", staff_name: "Maria Garcia", employee_id: "EMP-205", position: "Administrator", base_salary: 3200, allowances: 300, status: "processing", month: "May 2024" },
        { _id: "3", staff_name: "Kevin Peterson", employee_id: "EMP-088", position: "IT Support", base_salary: 2800, allowances: 200, status: "pending", month: "May 2024" },
        { _id: "4", staff_name: "Linda Thompson", employee_id: "EMP-312", position: "HR Manager", base_salary: 4000, allowances: 400, status: "disbursed", month: "May 2024" },
        { _id: "5", staff_name: "David Miller", employee_id: "EMP-144", position: "Faculty", base_salary: 3500, allowances: 250, status: "pending", month: "May 2024" },
    ], []);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return data.filter((row) => {
            const queryMatch = q.length === 0 || 
                row.staff_name.toLowerCase().includes(q) || 
                row.employee_id.toLowerCase().includes(q) ||
                row.position.toLowerCase().includes(q);
            const statusMatch = statusFilter === "all" ? true : row.status === statusFilter;
            return queryMatch && statusMatch;
        });
    }, [data, searchQuery, statusFilter]);

    const stats = useMemo(() => ({
        totalPayroll: "$428,000",
        disbursed: "$310,500",
        remaining: "$117,500",
        taxLiability: "$34,240"
    }), []);

    const columns: DataTableColumn<SalaryRecord>[] = useMemo(() => [
        {
            key: "staff",
            label: "Personnel identity",
            render: (row: SalaryRecord) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase">
                        {row.staff_name.substring(0, 2)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none mb-1">{row.staff_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.employee_id} &bull; {row.position}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "earnings",
            label: "Gross earnings",
            render: (row: SalaryRecord) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-900">${(row.base_salary + row.allowances).toLocaleString()}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">${row.base_salary} Base + ${row.allowances} Alw</span>
                </div>
            ),
        },
        {
            key: "period",
            label: "Payroll Cycle",
            render: (row: SalaryRecord) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.month}</span>,
        },
        {
            key: "status",
            label: "Disbursement state",
            render: (row: SalaryRecord) => (
                <Badge
                    variant={row.status === "disbursed" ? "success" : row.status === "processing" ? "warning" : "gray"}
                    className="capitalize text-[9px] font-black uppercase tracking-widest px-2"
                >
                    {row.status}
                </Badge>
            ),
        },
    ], []);

    const rowActions: RowAction<SalaryRecord>[] = useMemo(() => [
        {
            icon: "payments",
            label: "Disburse Now",
            variant: "primary",
            showIf: (row: SalaryRecord) => row.status === "pending",
            onClick: (row: SalaryRecord) => alert(`Disbursing to ${row.staff_name}`),
        },
        {
            icon: "description",
            label: "View Payslip",
            variant: "ghost",
            onClick: (row: SalaryRecord) => alert(`Payslip for ${row.staff_name}`),
        },
    ], []);

    return (
        <SchoolShell title="Payroll Command" eyebrow="Finance">
            <div className="space-y-8 relative min-h-[80vh] pb-10">
                {/* Stats Section - Premium & Financial */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Liabilities", value: stats.totalPayroll, icon: "account_balance", color: "text-blue-600", bg: "bg-blue-600/5" },
                        { label: "Disbursed Funds", value: stats.disbursed, icon: "check_circle", color: "text-emerald-600", bg: "bg-emerald-600/5" },
                        { label: "Pending Payouts", value: stats.remaining, icon: "pending", color: "text-amber-600", bg: "bg-amber-600/5" },
                        { label: "Tax Provision", value: stats.taxLiability, icon: "gavel", color: "text-purple-600", bg: "bg-purple-600/5" },
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
                                placeholder="Search staff name, ID or position..."
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/5 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-indigo-400"
                        >
                            <option value="all">Lifecycle: All</option>
                            <option value="disbursed">Disbursed Records</option>
                            <option value="processing">In Transaction</option>
                            <option value="pending">Awaiting Action</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
                            {filteredRows.length} <span className="text-slate-400">STAFF RECORDS</span>
                        </span>
                        <div className="h-6 w-px bg-slate-200" />
                        <button
                            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">payments</span>
                            Process Bulk
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
                            title: "No Payroll Data Found",
                            description: "Staff salary records for this period are currently unavailable."
                        }}
                    />
                </div>

                {/* Pagination Footer - Premium ERP Style */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-indigo-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{data.length}</span> Personnel
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="h-9 w-9 rounded-xl bg-indigo-600 text-[10px] font-black text-white shadow-lg shadow-indigo-600/20">1</button>
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