import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Badge, Button, Skeleton, DataState, Select } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";

type FeeComponent = {
  id: string;
  fee_type: string;
  amount: number;
  billing_mode: "recurring_monthly" | "onetime";
  due_date: string;
  notes: string;
};

type ClassFeeData = {
  class_name: string;
  academic_year: string;
  total_monthly_revenue: number;
  pending_dues: number;
  fee_components: FeeComponent[];
};

type DraftState = {
  name: string;
  amount: string;
  is_monthly: boolean;
  notes: string;
  target_period: string;
};

const generatePeriods = () => {
  const options = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (let i = currentMonth; i < 12; i++) options.push(`${months[i]} ${currentYear}`);
  for (let i = 0; i < 12; i++) options.push(`${months[i]} ${currentYear + 1}`);
  return options;
};

const periods = generatePeriods();

const emptyDraft: DraftState = {
  name: "",
  amount: "",
  is_monthly: true,
  notes: "",
  target_period: periods[0],
};

function money(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

export function ClassFeePage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ClassFeeData | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [error, setError] = useState<string>("");

  const summary = useMemo(() => {
    const components = data?.fee_components || [];
    return {
      monthly: components.filter(f => f.billing_mode === "recurring_monthly").reduce((sum, f) => sum + (f.amount || 0), 0),
      oneTime: components.filter(f => f.billing_mode === "onetime").reduce((sum, f) => sum + (f.amount || 0), 0),
      annual: components.reduce((sum, f) => sum + (f.billing_mode === "recurring_monthly" ? (f.amount || 0) * 12 : (f.amount || 0)), 0),
      count: components.length
    };
  }, [data]);

  const loadData = async () => {
    try {
      const result = await serviceRequest<any>(`/api/classes/${id}/fees`);
      
      // Load from LocalStorage fallback for stateless mock APIs
      const storageKey = `eduplexo_fees_${id}`;
      const cachedFees = JSON.parse(localStorage.getItem(storageKey) || "[]");
      
      if (result.success || result.ok) {
        const payload = result.data;
        const innerData = payload?.data?.data || payload?.data || payload;
        const apiFees = innerData?.fee_components || innerData?.fees || (Array.isArray(innerData) ? innerData : []);
        
        // Merge API fees with cached fees (deduplicating by ID)
        const feeMap = new Map();
        [...apiFees, ...cachedFees].forEach(f => {
          if (f.id) feeMap.set(f.id, f);
        });
        
        setData({
          class_name: innerData?.class_name || innerData?.name || "Class Billing",
          academic_year: innerData?.academic_year || "Current Session",
          total_monthly_revenue: innerData?.total_monthly_revenue || 0,
          pending_dues: innerData?.pending_dues || 0,
          fee_components: Array.from(feeMap.values())
        });
        setError("");
      } else {
        // Fallback to cache only if API fails
        setData(prev => ({
          class_name: prev?.class_name || "Class Billing",
          academic_year: prev?.academic_year || "Current Session",
          total_monthly_revenue: 0,
          pending_dues: 0,
          fee_components: cachedFees
        }));
      }
    } catch (err: any) {
      // If we have cached data, don't show full error
      const cached = localStorage.getItem(`eduplexo_fees_${id}`);
      if (cached) {
        setData(prev => ({
          ...prev!,
          fee_components: JSON.parse(cached)
        }));
      } else {
        setError("Unable to connect to billing server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCreate = async () => {
    if (!draft.amount || !draft.name) {
      showToast("Please provide a name and amount", "error");
      return;
    }

    setSaving(true);
    try {
      const [mName, yStr] = draft.target_period.split(' ');
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const mIdx = months.indexOf(mName);
      const dueDate = new Date(parseInt(yStr), mIdx, 1).toISOString().split('T')[0];

      const newComponent: FeeComponent = {
        id: Math.random().toString(36).substr(2, 9),
        fee_type: draft.name,
        amount: Number(draft.amount),
        due_date: draft.is_monthly ? new Date().toISOString().split('T')[0] : dueDate,
        billing_mode: draft.is_monthly ? "recurring_monthly" : "onetime",
        notes: draft.notes,
      };

      // 1. Call API (Stateless mock will return success but not save)
      await serviceRequest(`/api/classes/${id}/fees/components`, {
        method: "POST",
        body: JSON.stringify(newComponent),
      });

      // 2. Persist in LocalStorage to bypass stateless mock limitation
      const storageKey = `eduplexo_fees_${id}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify([...existing, newComponent]));

      showToast("Fee component deployed", "success");
      setDraft(emptyDraft);
      await loadData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (componentId: string) => {
    if (!confirm("Remove this fee component?")) return;
    setSaving(true);
    try {
      // 1. Call API
      await serviceRequest(`/api/classes/${id}/fees/components/${componentId}`, {
        method: "DELETE",
      });
      
      // 2. Remove from LocalStorage
      const storageKey = `eduplexo_fees_${id}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(storageKey, JSON.stringify(existing.filter((f: any) => f.id !== componentId)));

      showToast("Component removed", "success");
      await loadData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SchoolShell eyebrow="Finance" title="Fee Manager">
      <div className="w-full py-6 px-6 space-y-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        ) : error ? (
          <DataState variant="error" title="Data Load Error" message={error} />
        ) : (
          <>
            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <span className="material-symbols-outlined text-xl font-bold">payments</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{data?.class_name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{data?.academic_year}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => navigate("/admin/classes")} className="h-9 px-4 rounded-lg border border-slate-200 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-50">
                <span className="material-symbols-outlined text-base mr-2">arrow_back</span>
                Back
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Recurring", value: money(summary.monthly), icon: "sync", color: "blue" },
                { label: "One-time Fees", value: money(summary.oneTime), icon: "calendar_today", color: "amber" },
                { label: "Annual Total", value: money(summary.annual), icon: "account_balance_wallet", color: "emerald" },
                { label: "Active Fees", value: summary.count, icon: "list_alt", color: "slate" },
              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-2xl border border-${stat.color}-100 bg-${stat.color}-50/50 shadow-sm transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-[9px] font-black uppercase tracking-widest text-${stat.color}-600`}>{stat.label}</p>
                    <span className={`material-symbols-outlined text-${stat.color}-500 text-base`}>{stat.icon}</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-[320px]">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Configure Fee</h3>
                    <Badge variant={draft.is_monthly ? "primary" : "warning"} className="text-[8px] font-bold">{draft.is_monthly ? "Recurring" : "Once"}</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Fee Name</label>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        placeholder="e.g. Monthly Tuition"
                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Amount</label>
                      <input
                        type="number"
                        value={draft.amount}
                        onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                        placeholder="0"
                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Billing Mode</label>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 rounded-lg border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, is_monthly: true })}
                          className={`h-9 rounded-md text-[9px] font-black uppercase transition-all ${draft.is_monthly ? "bg-white text-blue-600 shadow-sm border border-blue-100" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          Recurring
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, is_monthly: false })}
                          className={`h-9 rounded-md text-[9px] font-black uppercase transition-all ${!draft.is_monthly ? "bg-white text-amber-600 shadow-sm border border-amber-100" : "text-slate-400 hover:text-slate-600"}`}
                        >
                          One-time
                        </button>
                      </div>
                    </div>

                    {!draft.is_monthly && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Target Billing Period</label>
                        <Select
                          value={draft.target_period}
                          onChange={(e) => setDraft({ ...draft, target_period: e.target.value })}
                          options={periods.map(p => ({ label: p, value: p }))}
                          className="h-10 rounded-lg text-sm font-bold"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Notes (Optional)</label>
                      <textarea
                        value={draft.notes}
                        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                        placeholder="Details..."
                        className="w-full h-16 rounded-lg border border-slate-200 p-3 text-xs font-bold text-slate-900 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
                      />
                    </div>

                    <Button className="w-full h-10 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20" onClick={handleCreate} disabled={saving || !draft.amount}>
                      {saving ? "Processing..." : "Add to Class"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Class Fee Structure</h3>

                  <div className="space-y-3">
                    {!data?.fee_components || data.fee_components.length === 0 ? (
                      <div className="py-20 flex flex-col items-center text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                        <span className="material-symbols-outlined text-3xl text-slate-200 mb-3">receipt_long</span>
                        <p className="text-[11px] text-slate-400 font-bold">No fees defined for this unit.</p>
                      </div>
                    ) : (
                      data.fee_components.map((fee) => {
                        const dueDate = fee.due_date ? new Date(fee.due_date) : null;
                        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        const dueLabel = dueDate ? `${months[dueDate.getMonth()]} ${dueDate.getFullYear()}` : "N/A";
                        
                        return (
                          <div key={fee.id} className="group p-4 rounded-xl bg-slate-50/30 border border-slate-100 hover:border-blue-200 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg ${fee.billing_mode === 'recurring_monthly' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'} flex items-center justify-center shadow-sm`}>
                                  <span className="material-symbols-outlined text-lg font-bold">{fee.billing_mode === 'recurring_monthly' ? 'sync' : 'event'}</span>
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-900">{fee.fee_type || "Standard Fee"}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className={`text-[9px] font-black uppercase tracking-tighter ${fee.billing_mode === 'recurring_monthly' ? "text-blue-600" : "text-amber-600"}`}>
                                      {fee.billing_mode === 'recurring_monthly' ? "Monthly Recurring" : `Once in ${dueLabel}`}
                                    </p>
                                    {fee.notes && <><span className="text-[9px] text-slate-300">·</span><p className="text-[9px] text-slate-400 font-bold italic truncate max-w-[150px]">{fee.notes}</p></>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-black text-slate-900">{money(fee.amount)}</p>
                                <div className="flex items-center justify-end gap-3 mt-1">
                                  <button onClick={() => handleDelete(fee.id)} className="text-[9px] font-black uppercase text-red-300 hover:text-red-500 transition-colors">Delete</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SchoolShell>
  );
}
