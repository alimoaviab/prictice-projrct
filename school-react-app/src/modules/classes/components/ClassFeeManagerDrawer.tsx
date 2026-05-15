import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";

type ClassFeeRecord = {
  id: string;
  fee_type_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  is_monthly: boolean;
  notes: string;
  total_for_year?: number;
};

type FeeTypeRecord = {
  id: string;
  name: string;
  is_recurring: boolean;
  category: string;
};

type ClassFeeResponse = {
  class_id: string;
  class_name: string;
  academic_year: string;
  total_annual: number;
  monthly_recurring: number;
  one_time_fees: number;
  fees: ClassFeeRecord[];
};

type Props = {
  isOpen: boolean;
  classItem: {
    _id: string;
    name: string;
    academic_year_id?: string;
    academic_year?: string;
  } | null;
  onClose: () => void;
};

type DraftState = {
  fee_type_id: string;
  amount: string;
  due_date: string;
  is_monthly: boolean;
  notes: string;
};

const emptyDraft: DraftState = {
  fee_type_id: "",
  amount: "",
  due_date: "",
  is_monthly: true,
  notes: "",
};

function toMoney(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

export function ClassFeeManagerDrawer({ isOpen, classItem, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feeTypes, setFeeTypes] = useState<FeeTypeRecord[]>([]);
  const [classFees, setClassFees] = useState<ClassFeeRecord[]>([]);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const summary = useMemo(() => ({
    recurring: classFees.filter((fee) => fee.is_monthly).reduce((sum, fee) => sum + fee.amount, 0),
    oneTime: classFees.filter((fee) => !fee.is_monthly).reduce((sum, fee) => sum + fee.amount, 0),
    total: classFees.reduce((sum, fee) => sum + (fee.total_for_year ?? fee.amount), 0),
  }), [classFees]);

  useEffect(() => {
    if (!isOpen || !classItem) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const [typesResult, classResult] = await Promise.all([
          serviceRequest<{ id: string; name: string; is_recurring: boolean; category: string }[]>("/api/school/fees/types"),
          serviceRequest<ClassFeeResponse>(`/api/school/fees/classes/${classItem._id}`),
        ]);

        if (cancelled) return;

        if (!typesResult.ok) {
          throw new Error(typesResult.error.message || "Failed to load fee types");
        }
        if (!classResult.ok) {
          throw new Error(classResult.error.message || "Failed to load class fees");
        }

        setFeeTypes((typesResult.data || []).map((item) => ({
          id: item.id,
          name: item.name,
          is_recurring: item.is_recurring,
          category: item.category,
        })));
        setClassFees(classResult.data?.fees || []);
        setEditingFeeId(null);
        setDraft(emptyDraft);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Failed to load class fee structure");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [classItem, isOpen]);

  if (!isOpen || !classItem) return null;

  const classAcademicYearId = classItem.academic_year_id ?? "";

  const handleCreate = async () => {
    if (!draft.fee_type_id || !draft.amount || !draft.due_date) return;

    setSaving(true);
    setError("");
    try {
      const result = await serviceRequest(`/api/school/fees/classes/${classItem._id}`, {
        method: "POST",
        body: JSON.stringify({
          academic_year_id: classAcademicYearId,
          fee_type_id: draft.fee_type_id,
          amount: Number(draft.amount),
          due_date: draft.due_date,
          is_monthly: draft.is_monthly,
          notes: draft.notes,
        }),
      });

      if (!result.ok) {
        throw new Error(result.error.message || "Failed to add fee component");
      }

      const refreshed = await serviceRequest<ClassFeeResponse>(`/api/school/fees/classes/${classItem._id}`);
      if (refreshed.ok) setClassFees(refreshed.data?.fees || []);
      setDraft(emptyDraft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add fee component");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (feeId: string, payload: ClassFeeRecord) => {
    setSaving(true);
    setError("");
    try {
      const result = await serviceRequest(`/api/school/fees/classes/${classItem._id}/${feeId}`, {
        method: "PUT",
        body: JSON.stringify({
          amount: payload.amount,
          due_date: payload.due_date,
          is_monthly: payload.is_monthly,
          notes: payload.notes,
        }),
      });

      if (!result.ok) {
        throw new Error(result.error.message || "Failed to update fee component");
      }

      const refreshed = await serviceRequest<ClassFeeResponse>(`/api/school/fees/classes/${classItem._id}`);
      if (refreshed.ok) setClassFees(refreshed.data?.fees || []);
      setEditingFeeId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update fee component");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feeId: string) => {
    setSaving(true);
    setError("");
    try {
      const result = await serviceRequest(`/api/school/fees/classes/${classItem._id}/${feeId}`, {
        method: "DELETE",
      });

      if (!result.ok) {
        throw new Error(result.error.message || "Failed to delete fee component");
      }

      setClassFees((rows) => rows.filter((row) => row.id !== feeId));
      if (editingFeeId === feeId) {
        setEditingFeeId(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete fee component");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-4xl flex-col bg-[#F8FAFF] shadow-[-28px_0_60px_-20px_rgba(15,23,42,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.28em] text-blue-600">Fee structure manager</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">{classItem.name}</h2>
            <p className="text-xs font-semibold text-slate-500">{classItem.academic_year || "Active academic year"}</p>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="grid flex-1 grid-rows-[auto_1fr] overflow-hidden">
          <div className="grid gap-4 border-b border-slate-200 bg-white px-6 py-4 md:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-[10px] font-black tracking-[0.2em] text-blue-600">Monthly</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{toMoney(summary.recurring)}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <p className="text-[10px] font-black tracking-[0.2em] text-amber-600">One-time</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{toMoney(summary.oneTime)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-[10px] font-black tracking-[0.2em] text-emerald-600">Annual total</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{toMoney(summary.total)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black tracking-[0.2em] text-slate-500">Components</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{classFees.length}</p>
            </div>
          </div>

          <div className="grid gap-0 overflow-hidden lg:grid-cols-[360px_1fr]">
            <div className="border-r border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400">Add component</p>
                  <h3 className="text-base font-black text-slate-900">Monthly / one-time fee</h3>
                </div>
                <Badge variant={draft.is_monthly ? "primary" : "warning"}>{draft.is_monthly ? "Monthly" : "One-time"}</Badge>
              </div>

              {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

              <div className="mt-5 space-y-4">
                <Select
                  label="Fee Type"
                  value={draft.fee_type_id}
                  onChange={(event) => setDraft({ ...draft, fee_type_id: event.target.value })}
                  options={[
                    { label: "Choose fee type", value: "" },
                    ...feeTypes.map((type) => ({ label: `${type.name}${type.is_recurring ? "" : " (one-time type)"}`, value: type.id })),
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Amount"
                    type="number"
                    min="0"
                    value={draft.amount}
                    onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={draft.due_date}
                    onChange={(event) => setDraft({ ...draft, due_date: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Billing mode"
                    value={draft.is_monthly ? "monthly" : "one-time"}
                    onChange={(event) => setDraft({ ...draft, is_monthly: event.target.value === "monthly" })}
                    options={[
                      { label: "Monthly", value: "monthly" },
                      { label: "One-time", value: "one-time" },
                    ]}
                  />
                  <Input
                    label="Notes"
                    value={draft.notes}
                    onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    placeholder="Optional note"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="button" onClick={handleCreate} disabled={saving || !draft.fee_type_id || !draft.amount || !draft.due_date}>
                    <span className="material-symbols-outlined text-base">add</span>
                    Add component
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setDraft(emptyDraft)}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400">Configured components</p>
                  <h3 className="text-base font-black text-slate-900">Class fee blueprint</h3>
                </div>
                {loading && <p className="text-xs font-semibold text-slate-500">Loading...</p>}
              </div>

              <div className="mt-4 space-y-3">
                {classFees.length === 0 && !loading ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
                    No fee components configured for this class yet.
                  </div>
                ) : null}

                {classFees.map((fee) => {
                  const editing = editingFeeId === fee.id;
                  return (
                    <div key={fee.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-slate-900">{fee.fee_type}</p>
                            <Badge variant={fee.is_monthly ? "primary" : "warning"}>{fee.is_monthly ? "Monthly" : "One-time"}</Badge>
                          </div>
                          <p className="mt-1 text-xs font-medium text-slate-500">Due {fee.due_date || "Not set"} · {fee.notes || "No notes"}</p>
                          <p className="mt-2 text-lg font-black text-slate-900">{toMoney(fee.amount)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingFeeId(editing ? null : fee.id)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                            {editing ? "Close" : "Edit"}
                          </button>
                          <button onClick={() => void handleDelete(fee.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:border-red-300">
                            Delete
                          </button>
                        </div>
                      </div>

                      {editing && (
                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                          <Input
                            label="Amount"
                            type="number"
                            min="0"
                            value={String(fee.amount)}
                            onChange={(event) => setClassFees((rows) => rows.map((row) => row.id === fee.id ? { ...row, amount: Number(event.target.value || 0) } : row))}
                          />
                          <Input
                            label="Due Date"
                            type="date"
                            value={fee.due_date}
                            onChange={(event) => setClassFees((rows) => rows.map((row) => row.id === fee.id ? { ...row, due_date: event.target.value } : row))}
                          />
                          <Select
                            label="Billing mode"
                            value={fee.is_monthly ? "monthly" : "one-time"}
                            onChange={(event) => setClassFees((rows) => rows.map((row) => row.id === fee.id ? { ...row, is_monthly: event.target.value === "monthly" } : row))}
                            options={[
                              { label: "Monthly", value: "monthly" },
                              { label: "One-time", value: "one-time" },
                            ]}
                          />
                          <Input
                            label="Notes"
                            value={fee.notes}
                            onChange={(event) => setClassFees((rows) => rows.map((row) => row.id === fee.id ? { ...row, notes: event.target.value } : row))}
                          />
                          <div className="md:col-span-4 flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => setEditingFeeId(null)}>Cancel</Button>
                            <Button type="button" onClick={() => void handleSave(fee.id, fee)} disabled={saving}>Save changes</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}