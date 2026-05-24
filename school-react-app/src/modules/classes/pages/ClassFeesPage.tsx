import { AppIcon } from "shared/ui/AppIcon";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DataState, Skeleton, Badge, Button } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { serviceRequest } from "@/services/service-client";
import { useClasses } from "@/modules/classes/hooks/useClasses";

type FeeComponent = {
    id: string;
    fee_type_id: string;
    fee_type: string;
    amount: number;
    type: "recurring" | "onetime";
    recurring_cycle: "monthly" | "quarterly";
    due_month: string;
    due_year: number;
    notes: string;
    status: string;
};

type ClassFeeData = {
    class_id: string;
    class_name: string;
    academic_year: string;
    total_annual: number;
    monthly_recurring: number;
    one_time_fees: number;
    fees: FeeComponent[];
};

type FeeType = {
    id: string;
    name: string;
};

export function ClassFeesPage() {
    const params = useParams();
    const navigate = useNavigate();
    const classId = params.id as string;

    const [data, setData] = useState<ClassFeeData | null>(null);
    const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Form state
    const [activeTab, setActiveTab] = useState<"recurring" | "onetime">("recurring");
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        recurring_cycle: "monthly" as "monthly" | "quarterly",
        due_month: new Date().toLocaleString('en-us', {month:'long'}).toLowerCase(),
        due_year: new Date().getFullYear(),
        notes: ""
    });

    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const years = [new Date().getFullYear(), new Date().getFullYear() + 1];

    useEffect(() => {
        loadData();
    }, [classId]);

    async function loadData() {
        setLoading(true);
        try {
            const [feeRes, studentRes] = await Promise.all([
                serviceRequest<ClassFeeData>(`/api/classes/${classId}/fees`),
                serviceRequest<any[]>(`/api/students?class_id=${classId}`)
            ]);

            if (feeRes.ok) setData(feeRes.data);
            if (studentRes.ok) setStudents(studentRes.data || []);
        } catch (err) {
            setError("Failed to load fee configuration");
        } finally {
            setLoading(false);
        }
    }

    const [genDate, setGenDate] = useState({
        month: new Date().toLocaleString('en-us', { month: 'long' }).toLowerCase(),
        year: new Date().getFullYear()
    });

    async function handleGenerate() {
        if (!window.confirm(`Generate invoices for all active students in this class for ${genDate.month.toUpperCase()} ${genDate.year}?`)) return;
        
        setSaving(true);
        try {
            const res = await serviceRequest("/api/fees/generate", {
                method: "POST",
                body: JSON.stringify({
                    class_id: classId,
                    month: genDate.month,
                    year: genDate.year
                })
            });
            if (res.ok) {
                alert(`Generated successfully!`);
                navigate("/admin/fee"); // Jump to ledger to see results
            } else {
                alert(res.message || "Generation failed");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleSave() {
        if (!formData.name || !formData.amount) {
            alert("Please fill required fields");
            return;
        }

        setSaving(true);
        try {
            const result = await serviceRequest(`/api/classes/${classId}/fees/components`, {
                method: "POST",
                body: JSON.stringify({
                    name: formData.name,
                    amount: Number(formData.amount),
                    type: activeTab,
                    recurring_cycle: "monthly",
                    due_month: activeTab === "onetime" ? formData.due_month : undefined,
                    due_year: activeTab === "onetime" ? formData.due_year : undefined,
                    notes: formData.notes
                })
            });

            if (result.ok) {
                setFormData({
                    name: "",
                    amount: "",
                    recurring_cycle: "monthly",
                    due_month: new Date().toLocaleString('en-us', {month:'long'}).toLowerCase(),
                    due_year: new Date().getFullYear(),
                    notes: ""
                });
                loadData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    const [showDeleteDrawer, setShowDeleteDrawer] = useState<FeeComponent | null>(null);

    // ... existing loadData ...

    async function handleDuplicate(feeId: string) {
        try {
            console.log("Duplicating fee:", feeId);
            const res = await serviceRequest(`/api/classes/${classId}/fees/components/${feeId}/duplicate`, { method: "POST" });
            if (res.ok) {
                loadData();
            } else {
                console.error("Duplicate failed", res);
            }
        } catch (err) { console.error(err); }
    }

    async function handleToggleStatus(feeId: string) {
        try {
            console.log("Toggling fee status:", feeId);
            const res = await serviceRequest(`/api/classes/${classId}/fees/components/${feeId}/toggle`, { method: "POST" });
            if (res.ok) {
                loadData();
            } else {
                console.error("Toggle failed", res);
            }
        } catch (err) { console.error(err); }
    }

    async function handleConfirmDelete() {
        if (!showDeleteDrawer) return;
        setSaving(true);
        try {
            const res = await serviceRequest(`/api/classes/${classId}/fees/components/${showDeleteDrawer.id}`, { method: "DELETE" });
            if (res.ok) {
                setShowDeleteDrawer(null);
                loadData();
            }
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    }

    if (loading) return <Skeleton className="h-[400px] w-full rounded-2xl" />;
    if (!data) return <DataState variant="error" title="No Data" message={error} />;

    return (
        <div className="space-y-4">
            {/* COMPACT SUMMARY STRIP */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                            <AppIcon name="BookOpen" size={18} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black tracking-widest text-slate-400">Class</p>
                            <h2 className="text-sm font-black text-slate-900">{data.class_name}</h2>
                        </div>
                    </div>
                    <div className="h-6 w-px bg-slate-100" />
                    <div>
                        <p className="text-[9px] font-black tracking-widest text-slate-400">Monthly Expected</p>
                        <p className="text-sm font-black text-emerald-600">Rs {data.monthly_recurring.toLocaleString()}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-100" />
                    <div>
                        <p className="text-[9px] font-black tracking-widest text-slate-400">One-time dues</p>
                        <p className="text-sm font-black text-amber-600">Rs {data.one_time_fees.toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="primary" className="px-3 py-1 text-[9px] font-black tracking-widest">{data.academic_year}</Badge>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5">
                {/* LEFT: COMPONENT LIST (70%) */}
                <div className="flex-1 space-y-4 lg:w-[68%]">
                    {/* BLUE MINI STATS */}
                    <div className="grid grid-cols-4 gap-3">
                        <StatCard label="Monthly" value={data.fees.filter(f => f.type === "recurring").length} icon="sync" />
                        <StatCard label="One-time" value={data.fees.filter(f => f.type === "onetime").length} icon="event_repeat" />
                        <StatCard label="Annual" value={`Rs ${data.total_annual.toLocaleString()}`} icon="database" />
                        <StatCard label="Status" value="Live" icon="auto_awesome" />
                    </div>

                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-900">Active fee components</h3>
                        </div>
                        
                        {data.fees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                                    <AppIcon name="CreditCard" size={24} />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">No components yet</h4>
                                <p className="text-xs text-slate-500">Configure your first billing rule.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.fees.map((fee) => (
                                    <div key={fee.id} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-all hover:bg-white hover:shadow-md">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${fee.type === "recurring" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                                                <AppIcon name={fee.type === "recurring" ? "autorenew" : "event_repeat"} size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-900">{fee.fee_type}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-black tracking-widest text-slate-400">{fee.type === "recurring" ? "monthly" : "one-time"}</span>
                                                    <span className="h-0.5 w-0.5 rounded-full bg-slate-200" />
                                                    <span className="text-[9px] font-black tracking-widest text-slate-400">
                                                        {fee.type === "recurring" ? "Every month" : `${fee.due_month} ${fee.due_year}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">Rs {fee.amount.toLocaleString()}</p>
                                                <p className={`text-[8px] font-black tracking-widest ${fee.status === 'active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {fee.status === 'active' ? 'Active' : 'Disabled'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                <button 
                                                    onClick={() => handleToggleStatus(fee.id)} 
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                                                    title={fee.status === 'active' ? 'Disable' : 'Enable'}
                                                >
                                                    <AppIcon name={fee.status === 'active' ? 'block' : 'check_circle'} size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDuplicate(fee.id)} 
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                                                    title="Duplicate"
                                                >
                                                    <AppIcon name="Copy" size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setShowDeleteDrawer(fee)} 
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                    title="Delete"
                                                >
                                                    <AppIcon name="Trash2" size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: QUICK ADD PANEL (30%) */}
                <div className="lg:w-[32%]">
                    <div className="sticky top-[80px] rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-[10px] font-black tracking-[0.2em] text-slate-900 text-center">Configure billing</h3>
                        
                        <div className="mb-6 flex rounded-xl bg-slate-50 p-1">
                            <button
                                onClick={() => setActiveTab("recurring")}
                                className={`flex-1 rounded-lg py-2 text-[9px] font-black tracking-widest transition-all ${
                                    activeTab === "recurring" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setActiveTab("onetime")}
                                className={`flex-1 rounded-lg py-2 text-[9px] font-black tracking-widest transition-all ${
                                    activeTab === "onetime" ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                One-time
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-[9px] font-black tracking-widest text-slate-400">Name</label>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Tuition Fee"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[9px] font-black tracking-widest text-slate-400">Amount (Rs)</label>
                                <input 
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    placeholder="e.g. 5000"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                />
                            </div>

                            {activeTab === "onetime" && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-black tracking-widest text-slate-400">Month</label>
                                        <select 
                                            value={formData.due_month}
                                            onChange={(e) => setFormData({...formData, due_month: e.target.value})}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        >
                                            {months.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-[9px] font-black tracking-widest text-slate-400">Year</label>
                                        <select 
                                            value={formData.due_year}
                                            onChange={(e) => setFormData({...formData, due_year: Number(e.target.value)})}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        >
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-1.5 block text-[9px] font-black tracking-widest text-slate-400">Notes</label>
                                <textarea 
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Internal reference..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`w-full rounded-xl py-3 text-[10px] font-black tracking-[0.2em] text-white shadow-lg transition-all active:scale-95 ${
                                    activeTab === "recurring" 
                                        ? "bg-blue-600 shadow-blue-500/10 hover:bg-blue-700" 
                                        : "bg-amber-500 shadow-amber-500/10 hover:bg-amber-600"
                                }`}
                            >
                                {saving ? "Saving..." : `Add ${activeTab === "recurring" ? "monthly" : "one-time"} fee`}
                            </button>
                        </div>
                    </div>
                </div>
                {/* DELETE SIDE DRAWER */}
            {showDeleteDrawer && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="h-full w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                        <div className="flex flex-col h-full">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Remove Component</h3>
                                <button onClick={() => setShowDeleteDrawer(null)} className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                                    <AppIcon name="X" className="text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="flex-1 p-6 space-y-6">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 mb-2">Selected component</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-black text-slate-900">{showDeleteDrawer.fee_type}</p>
                                        <p className="text-sm font-black text-blue-600">Rs {showDeleteDrawer.amount.toLocaleString()}</p>
                                    </div>
                                    <p className="mt-1 text-[10px] font-bold text-slate-500 tracking-tighter">
                                        {showDeleteDrawer.type === "recurring" ? "monthly" : "one-time"} • {showDeleteDrawer.status}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 text-red-600">
                                        <AppIcon name="AlertTriangle" size={18} className="mt-0.5" />
                                        <p className="text-[11px] font-bold leading-relaxed">
                                            Removing this component will stop it from being applied to student records in future billing cycles. Existing invoices will not be affected.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                <button 
                                    onClick={handleConfirmDelete}
                                    disabled={saving}
                                className={`w-full rounded-xl bg-red-600 py-3 text-[10px] font-black tracking-[0.2em] text-white shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95`}
                                >
                                    {saving ? "Processing..." : "Confirm delete"}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteDrawer(null)}
                                    className="w-full rounded-xl bg-white border border-slate-200 py-3 text-[10px] font-black tracking-[0.2em] text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>

            {/* STUDENTS SECTION */}
            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm mt-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-black text-slate-900">Enrolled Students ({students.length})</h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">Students who will receive these invoices</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400">
                            Invoices are auto-generated when the admin views the fee ledger for a month.
                        </p>
                    </div>
                </div>

                {students.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                        <AppIcon name="UserMinus" size={36} className="text-slate-200 mb-2" />
                        <p className="text-xs font-bold text-slate-400 tracking-widest">No students enrolled in this class</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {students.map((student: any) => (
                            <div key={student.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">{student.first_name} {student.last_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 tracking-widest truncate">Reg: {student.admission_no}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-slate-200/50 transition-all hover:shadow-md">
            <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">{label}</p>
                <p className="text-xl font-black text-blue-600 tabular-nums">{value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <AppIcon name={icon} />
            </div>
        </div>
    );
}
