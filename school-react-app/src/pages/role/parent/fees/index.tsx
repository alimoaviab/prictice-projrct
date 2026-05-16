/**
 * Parent fees view.
 *
 * The backend returns a normalised shape:
 *   { summary: { total, paid, due, percentage_paid, status },
 *     rows: [{ id, month, year, total, paid, pending, status, due_date, invoice_no }],
 *     due_notices: [...],
 *     student_id, student_name }
 *
 * The original page expected a richer "old" shape (`fee_summary`,
 * `fee_details`, `payment_history`) which the Go backend never
 * implemented. Reading `data.fee_summary.pending` directly was
 * crashing the parent portal with "Cannot read properties of
 * undefined (reading 'pending')".
 *
 * We adapt the backend response into the same UI sections — Financial
 * Overview, Fee Components, Payment History — and tolerate missing
 * fields with sensible defaults so an empty ledger renders cleanly
 * instead of throwing.
 */

import { useEffect, useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { DataState, Skeleton } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

interface FeesApiResponse {
  summary?: {
    total?: number;
    paid?: number;
    due?: number;
    percentage_paid?: number;
    status?: string;
  };
  rows?: Array<{
    id?: string;
    month?: string;
    year?: number;
    total?: number;
    paid?: number;
    pending?: number;
    status?: string;
    due_date?: string;
    invoice_no?: string;
  }>;
  due_notices?: Array<unknown>;
  student_id?: string;
  student_name?: string;
}

interface FeesView {
  summary: {
    total: number;
    paid: number;
    pending: number;
    percentagePaid: number;
    status: string;
  };
  components: Array<{
    key: string;
    label: string;
    amount: number;
    dueDate: string;
    status: string;
  }>;
  payments: Array<{
    receiptNo: string;
    date: string;
    amount: number;
    method: string;
  }>;
}

function adapt(api: FeesApiResponse | null): FeesView | null {
  if (!api) return null;
  const summary = api.summary || {};
  const rows = api.rows || [];
  const components = rows.map((r, i) => ({
    key: r.id || `${r.month || "row"}-${i}`,
    label: r.month && r.year ? `${r.month} ${r.year}` : r.month || `Row ${i + 1}`,
    amount: Number(r.total || 0),
    dueDate: r.due_date || "—",
    status: r.status || "pending",
  }));
  // The backend doesn't expose itemised payments yet — derive a simple
  // "what's paid" view from the same rows. Once the payments endpoint
  // lands the adapter can switch to it without changing this UI.
  const payments = rows
    .filter((r) => Number(r.paid || 0) > 0)
    .map((r, i) => ({
      receiptNo: r.invoice_no || `${r.month || "PMT"}-${i + 1}`,
      date: r.due_date || "—",
      amount: Number(r.paid || 0),
      method: "—",
    }));
  return {
    summary: {
      total: Number(summary.total || 0),
      paid: Number(summary.paid || 0),
      pending: Number(summary.due || 0),
      percentagePaid: Number(summary.percentage_paid || 0),
      status: summary.status || "—",
    },
    components,
    payments,
  };
}

export function ParentFeesPage() {
  const { selectedChild, loading: childLoading } = useSelectedChild();
  const [data, setData] = useState<FeesView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        if (!selectedChild) return;
        const res = await serviceRequest<FeesApiResponse>(
          `/api/parent/fees?student_id=${encodeURIComponent(selectedChild.student_id)}`
        );
        if (cancelled) return;
        if (res.ok) {
          setData(adapt(res.data));
        } else {
          setData(adapt(null));
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch fees:", err);
        if (!cancelled) setData(adapt(null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedChild]);

  if (childLoading || (loading && !data)) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </SchoolShell>
    );
  }

  if (!selectedChild) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
        <DataState
          variant="empty"
          title="No child selected"
          message="Pick a child from the header to view their fee statement."
        />
      </SchoolShell>
    );
  }

  if (!data || data.summary.total === 0) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
        <DataState
          variant="empty"
          title="No fees on record"
          message={`There are no fee invoices yet for ${selectedChild.student_name}.`}
        />
      </SchoolShell>
    );
  }

  const { summary, components, payments } = data;

  return (
    <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                Financial Overview
              </p>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Ledger Summary
              </h2>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${
                summary.pending > 0
                  ? "bg-amber-50 text-amber-600 border-amber-100"
                  : "bg-blue-50 text-blue-600 border-blue-100"
              }`}
            >
              Status: {summary.status}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Payable", value: summary.total, icon: "account_balance" },
              { label: "Total Paid", value: summary.paid, icon: "payments" },
              {
                label: "Outstanding",
                value: summary.pending,
                icon: "pending_actions",
                highlight: true,
              },
              {
                label: "Recovery Rate",
                value: `${summary.percentagePaid}%`,
                icon: "trending_up",
                isRaw: true,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="p-4 rounded-xl border border-slate-50 bg-slate-50/30"
              >
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                  {m.label}
                </p>
                <p
                  className={`text-lg font-black ${
                    m.highlight ? "text-blue-600" : "text-slate-900"
                  }`}
                >
                  {m.isRaw
                    ? String(m.value)
                    : `Rs. ${Number(m.value || 0).toLocaleString()}`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Components */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-[13px] font-black text-slate-900 tracking-tight">
                Fee Components
              </h3>
              <span className="material-symbols-outlined text-slate-300">receipt_long</span>
            </div>
            <div className="divide-y divide-slate-50">
              {components.length > 0 ? (
                components.map((fee) => (
                  <div
                    key={fee.key}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div>
                      <p className="text-[11px] font-black text-slate-800">{fee.label}</p>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">
                        Due: {fee.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-slate-900">
                        Rs. {fee.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest ${
                          fee.status === "paid"
                            ? "text-blue-600"
                            : fee.status === "partial"
                              ? "text-emerald-600"
                              : "text-amber-500"
                        }`}
                      >
                        {fee.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No fee components yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-[13px] font-black text-slate-900 tracking-tight">
                Payment History
              </h3>
              <span className="material-symbols-outlined text-slate-300">history</span>
            </div>
            <div className="divide-y divide-slate-50">
              {payments.length > 0 ? (
                payments.map((p) => (
                  <div
                    key={p.receiptNo}
                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">{p.receiptNo}</p>
                        <p className="text-[9px] font-medium text-slate-400">
                          {p.date} · {p.method}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-blue-600">
                      Rs. {p.amount.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No payments recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
