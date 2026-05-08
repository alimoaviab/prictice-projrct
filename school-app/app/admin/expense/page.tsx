"use client";

import { useMemo, useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { DataTable, DataTableColumn, Badge, DataState, RowAction } from "../../../components/ui";

interface ExpenseRecord {
    _id: string;
    description: string;
    category: "utilities" | "supplies" | "maintenance" | "marketing" | "other";
    amount: number;
    date: string;
    status: "approved" | "pending" | "rejected";
    payee: string;
}

export default function ExpensePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Mock data for premium demonstration
    const data: ExpenseRecord[] = useMemo(() => [
        { _id: "1", description: "Monthly Electricity Bill", category: "utilities", amount: 450, date: "2024-05-10", status: "approved", payee: "City Power Grid" },
        { _id: "2", description: "Office Stationery Supplies", category: "supplies", amount: 120, date: "2024-05-12", status: "pending", payee: "Global Stationers" },
        { _id: "3", description: "HVAC System Repair", category: "maintenance", amount: 850, date: "2024-05-05", status: "approved", payee: "QuickFix Services" },
        { _id: "4", description: "Social Media Campaign", category: "marketing", amount: 300, date: "2024-05-14", status: "pending", payee: "AdStream Media" },
        { _id: "5", description: "Laboratory Chemicals", category: "supplies", amount: 600, date: "2024-05-01", status: "rejected", payee: "BioChem Labs" },
    ], []);

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return data.filter((row) => {
            const queryMatch = q.length === 0 || 
                row.description.toLowerCase().includes(q) || 
                row.payee.toLowerCase().includes(q);
            const catMatch = categoryFilter === "all" ? true : row.category === categoryFilter;
            return queryMatch && catMatch;
        });
    }, [data, searchQuery, categoryFilter]);

    const stats = useMemo(() => ({
        totalBurn: "$12,450",
        utilities: "$3,200",
        supplies: "$1,850",
        burnRate: "+12.5%"
    }), []);

    const columns: DataTableColumn<ExpenseRecord>[] = useMemo(() => [
        {
            key: "description",
            label: "Transaction identity",
            render: (row: ExpenseRecord) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-[10px] font-black uppercase">
                        {row.category.substring(0, 2)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none mb-1">{row.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{row.payee}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            label: "Allocation",
            render: (row: ExpenseRecord) => (
                <Badge variant="gray" className="capitalize text-[10px] font-black tracking-widest px-1.5 bg-slate-50 border-slate-100 text-slate-500">
                    {row.category}
                </Badge>
            ),
        },
        {
            key: "amount",
            label: "Capital Outflow",
            render: (row: ExpenseRecord) => <span className="text-[11px] font-black text-slate-900">${row.amount.toLocaleString()}</span>,
        },
        {
            key: "date",
            label: "Date Index",
            render: (row: ExpenseRecord) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.date}</span>,
        },
        {
            key: "status",
            label: "Approval state",
            render: (row: ExpenseRecord) => (
                <Badge
                    variant={row.status === "approved" ? "success" : row.status === "rejected" ? "error" : "warning"}
                    className="capitalize text-[9px] font-black uppercase tracking-widest px-2"
                >
                    {row.status}
                </Badge>
            ),
        },
    ], []);

    const rowActions: RowAction<ExpenseRecord>[] = useMemo(() => [
        {
            icon: "check_circle",
            label: "Approve",
            variant: "primary",
            showIf: (row: ExpenseRecord) => row.status === "pending",
            onClick: (row: ExpenseRecord) => alert(`Approving ${row.description}`),
        },
        {
            icon: "receipt",
            label: "View Invoice",
            variant: "ghost",
            onClick: (row: ExpenseRecord) => alert(`Invoice for ${row.description}`),
        },
    ], []);

    return (
        <SchoolShell title="Burn Tracker" eyebrow="Finance">
            <div className="space-y-8 relative min-h-[80vh] pb-10">
                {/* Stats Section - Premium & Financial */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Operating Burn", value: stats.totalBurn, icon: "trending_down", color: "text-rose-600", bg: "bg-rose-600/5" },
                        { label: "Utility Index", value: stats.utilities, icon: "bolt", color: "text-amber-600", bg: "bg-amber-600/5" },
                        { label: "Supplies Index", value: stats.supplies, icon: "inventory_2", color: "text-blue-600", bg: "bg-blue-600/5" },
                        { label: "Monthly Delta", value: stats.burnRate, icon: "bar_chart", color: "text-emerald-600", bg: "bg-emerald-600/5" },
                    ].map((stat, i) => (
                        <div key={i} className="premium-card bg-white p-3.5 border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all cursor-default">
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
                                placeholder="Search transaction, payee or ID..."
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-rose-400 focus:ring-4 focus:ring-rose-600/5 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-rose-400"
                        >
                            <option value="all">Allocation: All</option>
                            <option value="utilities">Utilities / Energy</option>
                            <option value="supplies">Academic Supplies</option>
                            <option value="maintenance">Campus Maintenance</option>
                            <option value="marketing">Institutional Growth</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-2 whitespace-nowrap">
                            {filteredRows.length} <span className="text-slate-400">TRANSACTIONS</span>
                        </span>
                        <div className="h-6 w-px bg-slate-200" />
                        <button
                            className="inline-flex h-9 items-center gap-2 px-5 text-[11px] font-black uppercase tracking-widest text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                            Log Expense
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
                            title: "No Expenditure Records Found",
                            description: "Try refining your search parameters or log a new transaction."
                        }}
                    />
                </div>

                {/* Pagination Footer - Premium ERP Style */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-rose-600">1</span> to <span className="text-slate-900">{filteredRows.length}</span> of <span className="text-slate-900">{data.length}</span> Logs
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="h-9 px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="h-9 w-9 rounded-xl bg-rose-600 text-[10px] font-black text-white shadow-lg shadow-rose-600/20">1</button>
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