"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import DataState from "@/components/DataState";

interface Student {
    id: string;
    name: string;
    admission_no: string;
    class_name: string;
    avatar: string;
}

interface Fee {
    id: string;
    amount: number;
    paid: number;
    status: string;
    components: any[];
}

interface LedgerEntry {
    student: Student;
    current_fee: Fee | null;
    carry_forward: number;
    total_payable: number;
    paid_total: number;
    remaining: number;
    status: string;
}

interface DashboardData {
    stats: {
        monthly_total: number;
        monthly_collection: number;
        pending_amount: number;
        paid_count: number;
        partial_count: number;
        unpaid_count: number;
        collection_rate: number;
    };
    students: LedgerEntry[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export default function StudentFeeDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isPaying, setIsPaying] = useState<LedgerEntry | null>(null);
    
    // Filters
    const [filters, setFilters] = useState({
        status: 'all',
        class_id: '',
        month: new Date().toLocaleString('en-us', { month: 'long' }).toLowerCase(),
        year: String(new Date().getFullYear()),
        search: '',
        page: 1,
        limit: 20
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        method: 'Cash',
        reference: ''
    });

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters as any).toString();
            const res = await serviceRequest<DashboardData>(`/api/fees/ledger?${query}`);
            if (res.success) {
                setData(res.data);
            } else {
                showToast(res.message || "Failed to load dashboard", "error");
            }
        } catch (error) {
            showToast("Network error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [filters.status, filters.class_id, filters.month, filters.year, filters.page]);

    // Handle search with debounce if needed, but for now simple
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadDashboard();
    };

    const handleFullPayment = async (entry: LedgerEntry) => {
        setSaving(true);
        try {
            const res = await serviceRequest(`/api/fees/${entry.current_fee?.id}/pay`, {
                method: "POST",
                body: JSON.stringify({
                    amount: entry.remaining,
                    method: "cash",
                    reference: "Direct Full Payment"
                })
            });
            if (res.success) {
                showToast("Payment recorded successfully", "success");
                loadDashboard();
            } else {
                showToast(res.message, "error");
            }
        } catch (error) {
            showToast("Failed to process payment", "error");
        } finally {
            setSaving(false);
        }
    };

    const handlePartialPayment = async () => {
        if (!isPaying || !paymentForm.amount) return;
        
        setSaving(true);
        try {
            const res = await serviceRequest(`/api/fees/${isPaying.current_fee?.id}/pay`, {
                method: "POST",
                body: JSON.stringify({
                    amount: Number(paymentForm.amount),
                    method: paymentForm.method.toLowerCase(),
                    reference: paymentForm.reference
                })
            });
            if (res.success) {
                showToast("Payment recorded successfully", "success");
                setIsPaying(null);
                setPaymentForm({ amount: '', method: 'Cash', reference: '' });
                loadDashboard();
            } else {
                showToast(res.message, "error");
            }
        } catch (error) {
            showToast("Failed to process payment", "error");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Paid</Badge>;
            case "partial": return <Badge variant="warning" className="bg-amber-50 text-amber-600 border-amber-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Partial</Badge>;
            default: return <Badge variant="error" className="bg-slate-100 text-slate-500 border-slate-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">Unpaid</Badge>;
        }
    };

    const CompactPill = ({ label, value, color = "text-slate-900", bg = "bg-slate-50/50" }: any) => (
        <div className={`${bg} border border-slate-100 rounded-lg px-2 py-1 flex flex-col items-center justify-center text-center`}>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className={`text-[10px] font-black ${color} leading-none tracking-tight`}>Rs {Number(value || 0).toLocaleString()}</span>
        </div>
    );

    return (
        <SchoolShell eyebrow="Finance Management" title="Student Fee Collection">
            <div className="space-y-6 relative min-h-[80vh] pb-20 max-w-[1600px] mx-auto px-4">
                
                {/* ERP ANALYTICS HEADER */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Collected", value: data?.stats.monthly_collection, icon: "payments", color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Pending", value: data?.stats.pending_amount, icon: "assignment_late", color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Paid Count", value: data?.stats.paid_count, icon: "task_alt", color: "text-blue-600", bg: "bg-blue-50", isCount: true },
                        { label: "Partial Count", value: data?.stats.partial_count, icon: "pending_actions", color: "text-amber-600", bg: "bg-amber-50", isCount: true }
                    ].map((stat, i) => (
                        <div key={i} className={`p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all`}>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                                <p className={`text-lg font-black tracking-tight ${stat.color}`}>
                                    {stat.isCount ? stat.value : `Rs ${Number(stat.value || 0).toLocaleString()}`}
                                </p>
                            </div>
                            <div className={`h-10 w-10 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110`}>
                                <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FILTERS & SEARCH */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 flex-1 w-full">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] transition-colors group-focus-within:text-blue-600">search</span>
                            <input 
                                type="text" 
                                placeholder="Search admission or name..." 
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-[11px] font-black text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-400 transition-all"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                            />
                        </form>
                        <div className="h-10 px-1 bg-white border border-slate-200 rounded-xl flex items-center gap-1 shadow-sm">
                            {[
                                { id: "all", label: "All" },
                                { id: "paid", label: "Paid" },
                                { id: "partial", label: "Partial" },
                                { id: "unpaid", label: "Unpaid" }
                            ].map(st => (
                                <button
                                    key={st.id}
                                    onClick={() => setFilters({...filters, status: st.id, page: 1})}
                                    className={`px-4 h-8 flex items-center rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filters.status === st.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-800'}`}
                                >
                                    {st.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select 
                            value={filters.month} 
                            onChange={(e) => setFilters({...filters, month: e.target.value, page: 1})} 
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            {["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].map(m => (
                                <option key={m} value={m}>{m.toUpperCase()}</option>
                            ))}
                        </select>
                        <select 
                            value={filters.class_id} 
                            onChange={(e) => setFilters({...filters, class_id: e.target.value, page: 1})} 
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400 max-w-[140px] cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <option value="">ALL CLASSES</option>
                            {/* Classes would normally be populated from API */}
                        </select>
                    </div>
                </div>

                {/* HIGH-DENSITY LEDGER GRID */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                    </div>
                ) : data?.students.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-300">
                            <span className="material-symbols-outlined text-3xl">folder_off</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-base">No collections found</h4>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data?.students.map((entry) => (
                            <div 
                                key={entry.student.id} 
                                className="premium-card bg-white p-3 border-slate-200/60 shadow-sm flex flex-col group hover:border-blue-300 transition-all relative" 
                            >
                                {/* HEADER */}
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] flex-shrink-0 shadow-sm">
                                            {entry.student.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 text-[11px] truncate leading-none mb-1">{entry.student.name}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 rounded-sm uppercase">{entry.student.class_name}</span>
                                                <span className="text-[7px] font-bold text-slate-400">#{entry.student.admission_no}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()} className="scale-90 origin-right">
                                        {getStatusBadge(entry.status)}
                                    </div>
                                </div>

                                {/* FINANCIAL PILLS */}
                                <div className="grid grid-cols-2 gap-1 mb-3">
                                    <CompactPill label="Billed" value={entry.current_fee?.amount || 0} />
                                    <CompactPill label="Prev." value={entry.carry_forward} color="text-amber-600" />
                                    <CompactPill label="Paid" value={entry.paid_total} color="text-emerald-600" />
                                    <CompactPill label="Balance" value={entry.remaining} color="text-blue-600" bg="bg-blue-50/50" />
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center gap-1.5 mt-auto relative z-10" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        disabled={entry.status === "paid" || saving}
                                        onClick={() => handleFullPayment(entry)}
                                        className="flex-1 h-7 rounded-lg bg-blue-600 text-[8px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-10"
                                    >
                                        Full Paid
                                    </button>
                                    <button 
                                        disabled={entry.status === "paid" || saving}
                                        onClick={() => {
                                            setIsPaying(entry);
                                            setPaymentForm({...paymentForm, amount: String(entry.remaining)});
                                        }}
                                        className="flex-1 h-7 rounded-lg bg-white border border-slate-200 text-[8px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
                                    >
                                        Partial
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PAGINATION */}
                {data && data.pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button 
                            disabled={filters.page === 1}
                            onClick={() => setFilters({...filters, page: filters.page - 1})}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {filters.page} of {data.pagination.pages}
                        </span>
                        <button 
                            disabled={filters.page === data.pagination.pages}
                            onClick={() => setFilters({...filters, page: filters.page + 1})}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {/* PROFESSIONAL COLLECTION DRAWER */}
            {isPaying && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 animate-in fade-in duration-300">
                    <div className="h-full w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
                        {/* HEADER */}
                        <div className="p-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Fee Collection</h3>
                                <button 
                                    onClick={() => setIsPaying(null)}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest truncate">{isPaying.student.name}</p>
                        </div>

                        {/* CONTENT (Non-scrollable, tight) */}
                        <div className="flex-1 p-5 space-y-5">
                            {/* SUMMARY CARDS */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                                    <p className="text-sm font-black text-slate-900">Rs {isPaying.total_payable.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-2xl bg-white border border-blue-100 flex flex-col items-center text-center shadow-sm">
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Remaining</p>
                                    <p className="text-sm font-black text-blue-600">Rs {isPaying.remaining.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* PAYMENT FORM */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Amount (Rs)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">Rs</span>
                                        <input 
                                            type="number"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                            className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border-2 border-transparent text-slate-900 text-base font-black focus:bg-white focus:border-blue-500 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {['Cash', 'Bank', 'Online'].map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setPaymentForm({...paymentForm, method: mode})}
                                                className={`h-9 rounded-lg border-2 text-[8px] font-black uppercase tracking-widest transition-all ${paymentForm.method === mode ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference</label>
                                    <input 
                                        type="text"
                                        value={paymentForm.reference}
                                        onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border-2 border-transparent text-slate-900 text-[10px] font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                                        placeholder="Receipt No / ID"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="p-5 border-t border-slate-100 bg-white">
                            <button 
                                disabled={saving || !paymentForm.amount}
                                onClick={handlePartialPayment}
                                className="w-full h-11 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[16px]">verified</span>
                                        Confirm Collection
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SchoolShell>
    );
}
