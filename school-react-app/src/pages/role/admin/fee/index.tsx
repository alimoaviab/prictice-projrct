import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Badge, Skeleton, DataState, StatCardGrid } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import { useSettings } from "@/modules/settings/hooks/useSettings";
import { exportFeeBulkReport, type FeeBulkEntry } from "@/utils/fee-receipt";

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

export function StudentFeeDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isPaying, setIsPaying] = useState<LedgerEntry | null>(null);
    const [discountEntry, setDiscountEntry] = useState<LedgerEntry | null>(null);
    const [discountForm, setDiscountForm] = useState({ type: 'percentage', value: '', apply_mode: 'this_month', notes: '' });
    
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

    // Selection state for the bulk PDF export. The admin can tick rows on
    // the current page (or use the bulk-select shortcuts in the export
    // drawer to grab Unpaid / All-on-page).
    const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
    const [exporting, setExporting] = useState(false);
    const [showExportDrawer, setShowExportDrawer] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    // Plain-language export config. We never expose paper size,
    // orientation, compact density, or per-row notes — the engine
    // auto-derives all of those from the per-page count so admins
    // only think about how many vouchers they want and how they sit
    // on the page.
    const [exportConfig, setExportConfig] = useState({
        // Duplicate copies per student (one for parent, one for office, etc).
        copiesPerStudent: 1 as 1 | 2 | 3,
        // How many voucher slots per page. The engine picks the right
        // orientation + density automatically.
        copiesPerPage: 1 as 1 | 2 | 3 | 4,
    });

    // School identity for the report letterhead.
    const { state: settingsState } = useSettings();
    const settings = settingsState.data;

    // Real classes for the filter dropdown — picks up new classes via the
    // data bus, no manual refresh needed.
    const { state: classState } = useClasses({ page: 1, limit: 200 });
    const classOptions = useMemo(() => {
        const data: any = classState.data;
        const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        return rows.map((c: any) => ({ id: c._id || c.id, label: c.name }));
    }, [classState.data]);

    // Reset selection when the underlying ledger changes (filter / page change).
    useEffect(() => {
        setSelectedIds(new Set());
    }, [filters.status, filters.class_id, filters.month, filters.year, filters.page]);

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function selectAllOnPage() {
        if (!data?.students) return;
        setSelectedIds(new Set(data.students.map((e) => e.student.id)));
    }

    function selectByStatus(status: 'paid' | 'partial' | 'unpaid') {
        if (!data?.students) return;
        const next = new Set<string>();
        for (const e of data.students) {
            if (e.status === status) next.add(e.student.id);
        }
        setSelectedIds(next);
    }

    function clearSelection() {
        setSelectedIds(new Set());
    }

    function buildBulkEntries(): FeeBulkEntry[] {
        if (!data?.students) return [];
        const periodLabel = `${filters.month.charAt(0).toUpperCase()}${filters.month.slice(1)} ${filters.year}`;
        return data.students
            .filter((e) => selectedIds.has(e.student.id))
            .map((e) => ({
                student: {
                    id: e.student.id,
                    name: e.student.name,
                    admission_no: e.student.admission_no,
                    class_name: e.student.class_name,
                },
                period: periodLabel,
                monthly_fee: e.current_fee?.amount ?? 0,
                carry_forward: e.carry_forward,
                total_payable: e.total_payable,
                paid_total: e.paid_total,
                remaining: e.remaining,
                status: e.status,
                components: Array.isArray(e.current_fee?.components)
                    ? e.current_fee!.components.map((c: any) => ({
                        fee_type: c.fee_type_name || c.name || c.fee_type || "Fee",
                        amount: Number(c.amount) || 0,
                        is_optional: !!c.is_optional,
                        note: c.note,
                    }))
                    : undefined,
            }));
    }

    async function handleGenerateReport() {
        const baseEntries = buildBulkEntries();
        if (baseEntries.length === 0) {
            showToast("Select at least one student to generate a report.", "error");
            return;
        }

        // Duplicate each entry copiesPerStudent times. The PDF engine
        // doesn't know the concept of copies — at this layer we just
        // hand it a longer list.
        const entries: FeeBulkEntry[] = [];
        for (const e of baseEntries) {
            for (let i = 0; i < exportConfig.copiesPerStudent; i++) {
                entries.push(e);
            }
        }

        setExporting(true);
        try {
            exportFeeBulkReport(entries, {
                schoolName: settings?.academy_name || "School",
                logoUrl: settings?.logo_url || "/logo.jpeg",
                schoolAddress: [settings?.academy_address, settings?.academy_phone, settings?.academy_email]
                    .filter(Boolean)
                    .join(" · ") || undefined,
                principal: settings?.principal_name,
                period: `${filters.month.charAt(0).toUpperCase()}${filters.month.slice(1)} ${filters.year}`,
                currency: "Rs.",
                // The engine auto-picks orientation and density from
                // the count, so admins never see paper / orientation /
                // compact / notes knobs.
                studentsPerPage: exportConfig.copiesPerPage,
            });
            setShowExportDrawer(false);
        } finally {
            // Allow the print iframe to spawn before clearing the loading state.
            setTimeout(() => setExporting(false), 600);
        }
    }

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters as any).toString();
            const res = await serviceRequest<DashboardData>(`/api/fees/ledger?${query}`);
            if (res.success) {
                setData(res.data);
            } else {
                showToast(res.message || "Could not load fee dashboard. Please try refreshing the page.", "error");
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not connect to the server. Please check your internet connection and try again.", "error");
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
                showToast(res.message || "Payment could not be processed. Please verify the amount and try again.", "error");
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not connect to the server. Please check your internet and try again.", "error");
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
                showToast(res.message || "Payment could not be processed. Please verify the amount and try again.", "error");
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not connect to the server. Please check your internet and try again.", "error");
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

    const CompactPill = ({ label, value, color = "text-slate-900", bg = "bg-slate-50/50", subtext }: any) => (
        <div className={`${bg} border border-slate-100 rounded-lg px-2 py-1 flex flex-col items-center justify-center text-center relative overflow-hidden group/pill`}>
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className={`text-[10px] font-black ${color} leading-none tracking-tight`}>
                {typeof value === 'number' ? `Rs ${value.toLocaleString()}` : value}
            </span>
            {subtext && <span className="text-[6px] font-medium text-slate-400 mt-0.5">{subtext}</span>}
        </div>
    );

    return (
        <SchoolShell eyebrow="Finance Management" title="Student Fee Collection">
            <div className="space-y-6 relative min-h-[80vh] pb-20 max-w-[1600px] mx-auto px-4">
                
                {/* Stats Section */}
                <StatCardGrid
                  items={[
                    { label: "Collected", value: `Rs ${Number(data?.stats?.monthly_collection || 0).toLocaleString()}`, icon: "payments", accent: "emerald" },
                    { label: "Pending", value: `Rs ${Number(data?.stats?.pending_amount || 0).toLocaleString()}`, icon: "schedule", accent: "rose" },
                    { label: "Paid Students", value: data?.stats?.paid_count || 0, icon: "task_alt", accent: "blue" },
                    { label: "Partial Paid", value: data?.stats?.partial_count || 0, icon: "pending_actions", accent: "amber" },
                  ]}
                />

                {/* FILTERS & SEARCH */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 no-print">
                    <div className="flex items-center gap-2 flex-1 w-full">
                        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm group">
                            <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-600" />
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
                        {/* View Mode Toggle */}
                        <div className="inline-flex items-center bg-slate-100 rounded-lg p-0.5 no-print">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                title="Grid View"
                            >
                                <AppIcon name="LayoutGrid" size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                title="List View"
                            >
                                <AppIcon name="ViewList" size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowExportDrawer(true)}
                            className="h-10 px-4 rounded-xl border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-2 no-print shadow-sm"
                        >
                            <AppIcon name="FileText" size={16} />
                            Generate PDF
                            {selectedIds.size > 0 ? (
                                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[9px]">
                                    {selectedIds.size}
                                </span>
                            ) : null}
                        </button>
                        <div className="h-10 w-px bg-slate-200 mx-1 no-print" />
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
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400 max-w-[160px] cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <option value="">ALL CLASSES</option>
                            {classOptions.map((c: { id: string; label: string }) => (
                               <option key={c.id} value={c.id}>{c.label.toUpperCase()}</option>
                            ))}
                        </select>
                        {(filters.search || filters.status !== "all" || filters.class_id) && (
                          <button
                            type="button"
                            onClick={() => setFilters((prev) => ({ ...prev, search: "", status: "all", class_id: "", page: 1 }))}
                            className="h-10 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
                            title="Clear all filters"
                          >
                            <AppIcon name="FilterX" size={16} />
                            Reset
                          </button>
                        )}
                    </div>
                </div>

                {/* HIGH-DENSITY LEDGER GRID */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                    </div>
                ) : !data?.students || data.students.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-slate-200 no-print">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-400">
                            <AppIcon name="Wallet" size={30} />
                        </div>
                        <h4 className="font-black text-slate-900 text-base">No fee records found for {filters.month.toUpperCase()} {filters.year}</h4>
                        <p className="text-[11px] text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                            Invoices are generated automatically when you view a month. If no records appear, ensure fee components are configured for the class.
                        </p>
                        <button 
                            onClick={() => navigate('/admin/classes')}
                            className="mt-6 inline-flex items-center gap-2 no-print px-6 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            <AppIcon name="Settings" size={16} />
                            Configure Class Fees
                        </button>
                    </div>
                ) : viewMode === "list" ? (
                    /* ─── LIST VIEW ─────────────────────────────────────────── */
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-8">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === data.students.length && data.students.length > 0}
                                                onChange={() => {
                                                    if (selectedIds.size === data.students.length) setSelectedIds(new Set());
                                                    else setSelectedIds(new Set(data.students.map(e => e.student.id)));
                                                }}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                                            />
                                        </th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Class</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Monthly</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Arrears</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Paid</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-3 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.students.map((entry) => {
                                        const isSelected = selectedIds.has(entry.student.id);
                                        return (
                                            <tr key={entry.student.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}>
                                                <td className="px-3 py-2.5">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(entry.student.id)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-[8px] shrink-0">{entry.student.name.substring(0, 1).toUpperCase()}</div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-slate-900 truncate">{entry.student.name}</p>
                                                            <p className="text-[8px] text-slate-400">#{entry.student.admission_no}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-[10px] font-bold text-slate-600">{entry.student.class_name}</td>
                                                <td className="px-3 py-2.5 text-[10px] font-bold text-slate-900 text-right">Rs {(entry.current_fee?.amount || 0).toLocaleString()}</td>
                                                <td className="px-3 py-2.5 text-[10px] font-bold text-amber-600 text-right">{entry.carry_forward > 0 ? `Rs ${entry.carry_forward.toLocaleString()}` : "—"}</td>
                                                <td className="px-3 py-2.5 text-[10px] font-bold text-emerald-600 text-right">{entry.paid_total > 0 ? `Rs ${entry.paid_total.toLocaleString()}` : "—"}</td>
                                                <td className="px-3 py-2.5 text-[10px] font-black text-blue-700 text-right">Rs {entry.remaining.toLocaleString()}</td>
                                                <td className="px-3 py-2.5">{getStatusBadge(entry.status)}</td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-1">
                                                        <button disabled={entry.status === "paid" || saving} onClick={() => handleFullPayment(entry)} className="h-6 px-2 rounded-md bg-blue-600 text-[7px] font-bold text-white hover:bg-blue-700 disabled:opacity-20">Full</button>
                                                        <button disabled={entry.status === "paid" || saving} onClick={() => { setIsPaying(entry); setPaymentForm({...paymentForm, amount: String(entry.remaining)}); }} className="h-6 px-2 rounded-md border border-slate-200 text-[7px] font-bold text-slate-500 hover:bg-slate-50">Partial</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.students.map((entry) => {
                            const isSelected = selectedIds.has(entry.student.id);
                            return (
                            <div 
                                key={entry.student.id} 
                                className={`premium-card bg-white p-3 border-slate-200/60 shadow-sm flex flex-col group hover:border-blue-300 transition-all relative ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
                            >
                                {/* SELECT */}
                                <button
                                    type="button"
                                    aria-label={isSelected ? "Deselect for export" : "Select for export"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSelect(entry.student.id);
                                    }}
                                    className={`absolute top-2 right-2 z-20 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all no-print ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent hover:border-blue-400'}`}
                                >
                                    <AppIcon name="Check" size={14} className="font-black" />
                                </button>

                                {/* HEADER */}
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                            {entry.student.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 text-[11px] truncate leading-none mb-1 group-hover:text-blue-600 transition-colors">{entry.student.name}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 rounded-sm uppercase">{entry.student.class_name}</span>
                                                <span className="text-[7px] font-bold text-slate-400">#{entry.student.admission_no}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()} className="scale-90 origin-right mr-7">
                                        {getStatusBadge(entry.status)}
                                    </div>
                                </div>

                                {/* FINANCIAL PILLS */}
                                <div className="grid grid-cols-2 gap-1 mb-3">
                                    <CompactPill 
                                        label="Monthly" 
                                        value={entry.current_fee?.amount || 0} 
                                        subtext={!entry.current_fee ? "Not Generated" : undefined}
                                        color={!entry.current_fee ? "text-slate-300" : "text-slate-900"}
                                     />
                                    <CompactPill label="Previous" value={entry.carry_forward} color="text-amber-600" />
                                    <CompactPill label="Paid" value={entry.paid_total} color="text-emerald-600" />
                                    <CompactPill label="Total Amount" value={entry.remaining} color="text-blue-600" bg="bg-blue-50/50" />
                                </div>

                                {/* ACTIONS */}
                                <div className="flex items-center gap-1.5 mt-auto relative z-10 no-print" onClick={(e) => e.stopPropagation()}>
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
                                    <button 
                                        disabled={entry.status === "paid" || saving}
                                        onClick={() => setDiscountEntry(entry)}
                                        className="flex-1 h-7 rounded-lg bg-amber-50 border border-amber-200 text-[8px] font-black uppercase tracking-widest text-amber-700 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-10"
                                    >
                                        Discount
                                    </button>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}

                {/* PAGINATION */}
                {data && data.pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 no-print">
                        <button 
                            disabled={filters.page === 1}
                            onClick={() => setFilters({...filters, page: filters.page - 1})}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                        >
                            <AppIcon name="ChevronLeft" size={18} />
                        </button>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Page {filters.page} of {data.pagination.pages}
                        </span>
                        <button 
                            disabled={filters.page === data.pagination.pages}
                            onClick={() => setFilters({...filters, page: filters.page + 1})}
                            className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 disabled:opacity-50 transition-all"
                        >
                            <AppIcon name="ChevronRight" size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* PROFESSIONAL COLLECTION DRAWER */}
            {isPaying && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 animate-in fade-in duration-300 no-print">
                    <div className="h-full w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
                        {/* HEADER */}
                        <div className="p-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Fee Collection</h3>
                                <button 
                                    onClick={() => setIsPaying(null)}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <AppIcon name="X" size={16} />
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
                                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Amount</p>
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
                                        <AppIcon name="CheckCircle" size={16} />
                                        Confirm Collection
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DISCOUNT DRAWER */}
            {discountEntry && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 animate-in fade-in duration-300 no-print">
                    <div className="h-full w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
                        <div className="p-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Student Discount</h3>
                                <button onClick={() => setDiscountEntry(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <AppIcon name="X" size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold">{discountEntry.student.name} • {discountEntry.student.class_name}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Fee</p>
                                <p className="text-lg font-black text-slate-900">Rs {(discountEntry.current_fee?.amount || 0).toLocaleString()}</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Discount Type</label>
                                    <select value={discountForm.type} onChange={(e) => setDiscountForm({...discountForm, type: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500">
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (Rs)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Value</label>
                                    <input type="number" value={discountForm.value} onChange={(e) => setDiscountForm({...discountForm, value: e.target.value})} placeholder={discountForm.type === 'percentage' ? 'e.g. 20' : 'e.g. 1000'} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500" />
                                </div>
                                {discountForm.value && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1.5">
                                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Preview</p>
                                        <div className="flex justify-between text-xs"><span className="text-slate-600">Current Fee</span><span className="font-bold text-slate-900">Rs {(discountEntry.current_fee?.amount || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-600">Discount</span><span className="font-bold text-red-600">- Rs {(discountForm.type === 'percentage' ? Math.round((discountEntry.current_fee?.amount || 0) * Number(discountForm.value) / 100) : Number(discountForm.value)).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-xs pt-1.5 border-t border-emerald-200"><span className="font-bold text-slate-900">Remaining</span><span className="font-black text-emerald-700">Rs {((discountEntry.current_fee?.amount || 0) - (discountForm.type === 'percentage' ? Math.round((discountEntry.current_fee?.amount || 0) * Number(discountForm.value) / 100) : Number(discountForm.value))).toLocaleString()}</span></div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Apply Mode</label>
                                    <select value={discountForm.apply_mode} onChange={(e) => setDiscountForm({...discountForm, apply_mode: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500">
                                        <option value="this_month">This Month Only</option>
                                        <option value="recurring">Recurring (Every Month)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Notes</label>
                                    <input type="text" value={discountForm.notes} onChange={(e) => setDiscountForm({...discountForm, notes: e.target.value})} placeholder="Reason for discount..." className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-white">
                            <button disabled={saving || !discountForm.value} onClick={async () => { setSaving(true); try { const now = new Date(); const res = await serviceRequest('/api/fee-discounts', { method: 'POST', body: JSON.stringify({ student_id: discountEntry.student.id, fee_id: discountEntry.current_fee?.id, type: discountForm.type, value: Number(discountForm.value), apply_mode: discountForm.apply_mode, month: now.toLocaleString('en', { month: 'long' }).toLowerCase(), year: now.getFullYear(), notes: discountForm.notes }) }); if (res.success) { showToast("Discount applied", "success"); setDiscountEntry(null); setDiscountForm({ type: 'percentage', value: '', apply_mode: 'this_month', notes: '' }); loadDashboard(); } else { showToast(res.message || "Failed", "error"); } } catch { showToast("Network error", "error"); } finally { setSaving(false); } }} className="w-full h-11 rounded-xl bg-amber-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><AppIcon name="Tag" size={16} />Apply Discount</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF EXPORT DRAWER */}
            {showExportDrawer && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 animate-in fade-in duration-300 no-print">
                    <div className="h-full w-[380px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-slate-100">
                        <div className="p-5 border-b border-slate-100 bg-white">
                            <div className="flex items-center justify-between mb-0.5">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">Generate Fee PDF</h3>
                                <button 
                                    onClick={() => setShowExportDrawer(false)}
                                    className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <AppIcon name="X" size={16} />
                                </button>
                            </div>
                            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                                {selectedIds.size * exportConfig.copiesPerStudent} voucher{selectedIds.size * exportConfig.copiesPerStudent === 1 ? '' : 's'} · {Math.max(0, Math.ceil((selectedIds.size * exportConfig.copiesPerStudent) / exportConfig.copiesPerPage))} page{Math.max(0, Math.ceil((selectedIds.size * exportConfig.copiesPerStudent) / exportConfig.copiesPerPage)) === 1 ? '' : 's'}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {/* Premium summary card */}
                            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/20 relative overflow-hidden">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                                <div className="relative grid grid-cols-2 gap-y-4 gap-x-3">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/80">Selected Students</p>
                                        <p className="text-[26px] font-bold tracking-tight leading-none mt-1.5">{selectedIds.size}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/80">Copies Per Student</p>
                                        <p className="text-[26px] font-bold tracking-tight leading-none mt-1.5">{exportConfig.copiesPerStudent}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/80">Total Vouchers</p>
                                        <p className="text-[26px] font-bold tracking-tight leading-none mt-1.5">{selectedIds.size * exportConfig.copiesPerStudent}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-100/80">Estimated Pages</p>
                                        <p className="text-[26px] font-bold tracking-tight leading-none mt-1.5">{Math.max(0, Math.ceil((selectedIds.size * exportConfig.copiesPerStudent) / exportConfig.copiesPerPage))}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Copies Per Student */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <h4 className="text-[13px] font-bold text-slate-900">Copies Per Student</h4>
                                    <span className="text-[10px] font-bold text-blue-600">{exportConfig.copiesPerStudent} ×</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    How many fee voucher copies should be printed for each student?
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                    {([1, 2, 3] as const).map((n) => {
                                        const active = exportConfig.copiesPerStudent === n;
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setExportConfig((prev) => ({ ...prev, copiesPerStudent: n }))}
                                                className={`h-14 rounded-xl border text-left px-3 transition-all ${active ? "border-blue-600 bg-blue-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                                            >
                                                <p className={`text-[18px] font-bold leading-none ${active ? "text-blue-700" : "text-slate-900"}`}>{n}</p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1">{n === 1 ? "One copy" : `${n} copies`}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Student Copies Per Page */}
                            <div className="space-y-2">
                                <div className="flex items-baseline justify-between">
                                    <h4 className="text-[13px] font-bold text-slate-900">Student Copies Per Page</h4>
                                    <span className="text-[10px] font-bold text-blue-600">
                                        {exportConfig.copiesPerPage === 1 ? "Large" : exportConfig.copiesPerPage === 2 ? "Medium" : exportConfig.copiesPerPage === 3 ? "Tight" : "Compact"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    How many voucher copies appear on a single page? We auto-adjust the size for the cleanest result.
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {([1, 2, 3, 4] as const).map((n) => {
                                        const active = exportConfig.copiesPerPage === n;
                                        const label = n === 1 ? "Large" : n === 2 ? "Medium" : n === 3 ? "Tight" : "Compact";
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setExportConfig((prev) => ({ ...prev, copiesPerPage: n }))}
                                                className={`h-14 rounded-xl border flex flex-col items-center justify-center transition-all ${active ? "border-blue-600 bg-blue-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                                            >
                                                <p className={`text-[15px] font-bold leading-none ${active ? "text-blue-700" : "text-slate-900"}`}>{n}</p>
                                                <p className="text-[9px] font-bold text-slate-500 mt-1.5">{label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Select</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllOnPage}
                                        className="h-10 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-blue-200 hover:text-blue-600 transition-all"
                                    >
                                        All on page
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="h-10 rounded-xl border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-slate-300 transition-all"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectByStatus('unpaid')}
                                        className="h-10 rounded-xl border-2 border-rose-100 bg-rose-50/50 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all"
                                    >
                                        Unpaid only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectByStatus('partial')}
                                        className="h-10 rounded-xl border-2 border-amber-100 bg-amber-50/50 text-[10px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-100 transition-all"
                                    >
                                        Partial only
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                                    Tip — quick-select acts on the students currently on this page.
                                    Apply a class filter or change the page to scope further.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Selected Students</label>
                                <div className="rounded-2xl border border-slate-100 max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                                    {selectedIds.size === 0 ? (
                                        <p className="text-[11px] text-slate-400 text-center py-6">
                                            No students selected. Tick checkboxes on the cards or use a quick-select above.
                                        </p>
                                    ) : (
                                        (data?.students ?? [])
                                            .filter((e) => selectedIds.has(e.student.id))
                                            .map((e) => (
                                                <div key={e.student.id} className="px-3 py-2 flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-black text-slate-900 truncate">{e.student.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {e.student.class_name} · #{e.student.admission_no}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSelect(e.student.id)}
                                                        className="h-6 w-6 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <AppIcon name="X" size={16} />
                                                    </button>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-white">
                            <button
                                disabled={exporting || selectedIds.size === 0}
                                onClick={handleGenerateReport}
                                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-0.5 active:scale-[0.99]"
                            >
                                {exporting ? (
                                    <div className="h-5 w-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="text-[14px] font-bold tracking-tight inline-flex items-center gap-2">
                                            <AppIcon name="FileText" size={18} />
                                            Generate Fee Vouchers
                                        </span>
                                        <span className="text-[11px] font-medium text-blue-100/90">
                                            {selectedIds.size * exportConfig.copiesPerStudent} voucher{selectedIds.size * exportConfig.copiesPerStudent === 1 ? '' : 's'} · {Math.max(0, Math.ceil((selectedIds.size * exportConfig.copiesPerStudent) / exportConfig.copiesPerPage))} page{Math.max(0, Math.ceil((selectedIds.size * exportConfig.copiesPerStudent) / exportConfig.copiesPerPage)) === 1 ? '' : 's'}
                                        </span>
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
