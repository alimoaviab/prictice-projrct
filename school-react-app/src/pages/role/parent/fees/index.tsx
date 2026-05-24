import { AppIcon } from "shared/ui/AppIcon";
/**
 * Parent Fees — premium redesign matching the admin/parent dashboards'
 * compact aesthetic.
 *
 * Visual contract:
 *   - Hero strip: child identity + payment status + last invoice number.
 *   - 4-up KPI row using StatCardCompact (admin pattern):
 *       Total Payable · Total Paid · Outstanding · Recovery Rate.
 *   - Recovery progress bar sits below the KPIs as a "ledger pulse".
 *   - Two-column body:
 *       Left  — Fee Components (each invoice row, status pill).
 *       Right — Payment History (receipt rows, verified ticks).
 *   - Premium empty + loading states.
 *
 * API contract is preserved 1:1 with the previous implementation:
 *   GET /api/parent/fees?student_id=… → { summary, rows, due_notices, … }
 *
 * The same `adapt()` function maps the backend shape into the view model so
 * the UI never trips on missing fields. Only JSX/styling changed.
 */

import { useEffect, useState, useMemo } from "react";

import { SchoolShell } from "@/layouts/SchoolShell";
import { DataState, Skeleton, StatCardCompact } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

// ────────────────────────────────────────────────────────────────────────
// API + view model contracts (preserved verbatim from the previous file)
// ────────────────────────────────────────────────────────────────────────

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
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
    status: string;
    invoiceNo: string;
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
    paidAmount: Number(r.paid || 0),
    pendingAmount: Number(r.pending || 0),
    dueDate: r.due_date || "—",
    status: r.status || "pending",
    invoiceNo: r.invoice_no || "",
  }));
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

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────

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
          `/api/parent/fees?student_id=${encodeURIComponent(selectedChild.student_id)}`,
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

  // Latest invoice number — first row that has one set; falls back to "—".
  const latestInvoice = useMemo(
    () => data?.components.find((c) => !!c.invoiceNo)?.invoiceNo || "",
    [data],
  );

  // ────────────────────────────────────────────────────────────────────
  // States
  // ────────────────────────────────────────────────────────────────────

  if (childLoading || (loading && !data)) {
    return (
      <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[80px] w-full rounded-xl" />
              ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
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
        <PremiumEmpty
          title="No fees on record"
          message={`There are no fee invoices yet for ${selectedChild.student_name}.`}
        />
      </SchoolShell>
    );
  }

  const { summary, components, payments } = data;
  const recoveryPercent = Math.max(0, Math.min(100, summary.percentagePaid));
  const isPaidUp = summary.pending <= 0 && summary.total > 0;

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
      {/* ── Hero strip ───────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Fee Ledger
            </span>
            <span className="text-[10px] font-bold text-slate-400 normal-case truncate">
              Viewing: {selectedChild.student_name}
            </span>
            {latestInvoice ? (
              <span className="text-[10px] font-bold text-slate-400 normal-case">
                Latest: {latestInvoice}
              </span>
            ) : null}
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                isPaidUp
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : summary.pending > 0
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-slate-50 text-slate-500 border-slate-100"
              }`}
            >
              {isPaidUp ? (
                <AppIcon name="CheckCircle2" size={12} />
              ) : (
                <AppIcon name="PendingActions" size={12} />
              )}
              {isPaidUp ? "All paid" : summary.status}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Financial Overview
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="GraduationCap" size={14} />
              <span className="text-[11px] font-bold">
                {selectedChild.class_name}
                {selectedChild.class_section
                  ? ` - ${selectedChild.class_section}`
                  : ""}
              </span>
            </div>
            {selectedChild.academic_year ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="Calendar" size={14} />
                <span className="text-[11px] font-bold">
                  {selectedChild.academic_year}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="Receipt" size={14} />
              <span className="text-[11px] font-bold">
                {components.length} invoice{components.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch gap-3 md:border-l md:border-slate-100 md:pl-6 shrink-0">
          <div className="rounded-xl border border-blue-100/60 bg-blue-50/30 px-4 py-2.5 min-w-[110px]">
            <p className="text-[9px] font-black text-blue-700/70 uppercase tracking-[0.1em]">
              Paid
            </p>
            <p className="text-lg font-black text-blue-700 leading-tight tabular-nums">
              Rs. {summary.paid.toLocaleString()}
            </p>
          </div>
          <div
            className={`rounded-xl border px-4 py-2.5 min-w-[110px] ${
              summary.pending > 0
                ? "border-amber-100/60 bg-amber-50/30"
                : "border-emerald-100/60 bg-emerald-50/30"
            }`}
          >
            <p
              className={`text-[9px] font-black uppercase tracking-[0.1em] ${summary.pending > 0 ? "text-amber-700/70" : "text-emerald-700/70"}`}
            >
              Outstanding
            </p>
            <p
              className={`text-lg font-black leading-tight tabular-nums ${summary.pending > 0 ? "text-amber-700" : "text-emerald-700"}`}
            >
              Rs. {summary.pending.toLocaleString()}
            </p>
          </div>
        </div>

        <AppIcon name="CreditCard" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardCompact
          label="Total Payable"
          value={`Rs. ${summary.total.toLocaleString()}`}
          icon="account_balance"
          accent="slate"
          hint="Across all invoices"
        />
        <StatCardCompact
          label="Total Paid"
          value={`Rs. ${summary.paid.toLocaleString()}`}
          icon="payments"
          accent="blue"
          hint={`${summary.percentagePaid}% recovered`}
        />
        <StatCardCompact
          label="Outstanding"
          value={`Rs. ${summary.pending.toLocaleString()}`}
          icon="pending_actions"
          accent={summary.pending > 0 ? "rose" : "emerald"}
          hint={
            summary.pending > 0
              ? `${100 - summary.percentagePaid}% remaining`
              : "Cleared"
          }
        />
        <StatCardCompact
          label="Recovery Rate"
          value={`${recoveryPercent}%`}
          icon="trending_up"
          accent="emerald"
          hint="Of total payable"
        />
      </div>

      {/* ── Recovery progress strip ──────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between px-4 py-2.5 bg-blue-50/30 rounded-xl border border-blue-100/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shrink-0">
            <AppIcon name="ListTodo" size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-700">Ledger Pulse</p>
            <p className="text-[8px] font-medium text-slate-500 normal-case tracking-tighter truncate">
              Rs. {summary.paid.toLocaleString()} of Rs.{" "}
              {summary.total.toLocaleString()} settled
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md mx-6">
          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${isPaidUp ? "bg-emerald-500" : "bg-blue-600"}`}
              style={{ width: `${recoveryPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-blue-600 tabular-nums">
            {recoveryPercent}%
          </span>
        </div>
        <span className="text-[9px] font-bold text-slate-400 normal-case">
          {isPaidUp ? "All clear" : `Rs. ${summary.pending.toLocaleString()} due`}
        </span>
      </div>

      {/* ── Body grid: components (2/3) + payments (1/3) ────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fee Components */}
        <div className="lg:col-span-2 premium-card p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-bold normal-case text-slate-400">
                Fee Components
              </h3>
              <p className="text-[9px] font-medium text-slate-400 normal-case">
                Each invoice and its current status
              </p>
            </div>
            <AppIcon name="Receipt" size={16} className="text-slate-300" />
          </div>

          {components.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {components.map((fee) => {
                const tone = statusTone(fee.status);
                return (
                  <div
                    key={fee.key}
                    className="px-1 py-3 flex items-center justify-between hover:bg-slate-50/40 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${tone.bg} ${tone.text}`}
                      >
                        <AppIcon name={fee.status === "paid"
                            ? "verified"
                            : fee.status === "partial"
                              ? "hourglass_top"
                              : "schedule"} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-black text-slate-900 truncate">
                          {fee.label}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                          Due: {fee.dueDate}
                          {fee.invoiceNo ? ` · #${fee.invoiceNo}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black text-slate-900 tabular-nums">
                        Rs. {fee.amount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${tone.bg} ${tone.text} ${tone.border}`}
                      >
                        {fee.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <PremiumEmpty
              compact
              title="No fee components yet"
              message="Invoices for this student will appear here once issued."
            />
          )}
        </div>

        {/* Payment History */}
        <div className="premium-card p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[10px] font-bold normal-case text-slate-400">
                Payment History
              </h3>
              <p className="text-[9px] font-medium text-slate-400 normal-case">
                Most recent receipts
              </p>
            </div>
            <AppIcon name="History" size={16} className="text-slate-300" />
          </div>

          {payments.length > 0 ? (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {payments.map((p) => (
                <div
                  key={p.receiptNo}
                  className="rounded-lg border border-slate-100 p-2.5 hover:border-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <AppIcon name="CheckCircle" size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate">
                          {p.receiptNo}
                        </p>
                        <p className="text-[9px] font-medium text-slate-400">
                          {p.date}
                          {p.method && p.method !== "—" ? ` · ${p.method}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] font-black text-blue-600 shrink-0 tabular-nums">
                      Rs. {p.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PremiumEmpty
              compact
              title="No payments yet"
              message="Receipts will appear here as soon as a payment is recorded."
            />
          )}
        </div>
      </div>
    </SchoolShell>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function statusTone(status: string) {
  switch (status) {
    case "paid":
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-100",
      };
    case "partial":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    case "overdue":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
      };
    default:
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
      };
  }
}

function PremiumEmpty({
  title,
  message,
  compact = false,
}: {
  title: string;
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${compact ? "p-8" : "p-12"} text-center flex flex-col items-center justify-center`}
    >
      <div
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-full bg-white shadow-sm flex items-center justify-center mb-3`}
      >
        <AppIcon name="Receipt" className={` text-slate-300 ${compact ? "text-[20px]" : "text-[24px]"} `} />
      </div>
      <p className={`${compact ? "text-[12px]" : "text-[13px]"} font-black text-slate-700`}>
        {title}
      </p>
      <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-500 mt-1 max-w-sm`}>
        {message}
      </p>
    </div>
  );
}
