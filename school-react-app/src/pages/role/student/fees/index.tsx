import { AppIcon } from "shared/ui/AppIcon";
/**
 * Student Fees — premium redesign with real Print actions.
 *
 *   - Page-level "Print Statement" button → exportFeeStatement() builds a
 *     branded HTML statement (school header, totals, components, payment
 *     history) and pipes it through the browser print dialog.
 *   - Per-payment "Print" button → exportFeeReceipt() generates a single
 *     branded receipt with the receipt number, date, method, status, and
 *     amount.
 *
 * Both helpers live in @/utils/fee-receipt and mirror the marksheet
 * utility so school-branded documents feel like a single family.
 *
 * The data fetch contract is unchanged — same `/api/parent/fees` endpoint
 * the previous student fees page used.
 */

import { useEffect, useMemo } from "react";

import { DataState, Skeleton, StatCardCompact } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import {
  exportFeeReceipt,
  exportFeeStatement,
  type FeeReceiptStudent,
} from "@/utils/fee-receipt";

// ────────────────────────────────────────────────────────────────────────
// API contract — preserved 1:1 from the previous student fees page.
// ────────────────────────────────────────────────────────────────────────

type FeesResponse = {
  student: string;
  class: string;
  academic_year: string;
  fee_summary: {
    total_fee: number;
    collected: number;
    pending: number;
    percentage_paid: number;
    status: string;
  };
  fee_details: Array<{
    fee_type: string;
    amount: number;
    due_date: string;
    status: string;
    payment_date: string | null;
    receipt_no: string | null;
  }>;
  payment_history: Array<{
    receipt_no: string;
    date: string;
    amount: number;
    fee_type: string;
    method: string;
    status: string;
  }>;
};

async function resolveStudentId(studentId?: string) {
  if (studentId) return studentId;
  const result = await serviceRequest<{ students: Array<{ id: string }> }>(
    "/api/parent/student-info",
  );
  return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────

export function StudentFeesPage() {
  const { user } = useAuth();
  const { state, run } = useSafeAsync<FeesResponse>();

  // Tenant-aware school name & principal — same fallback pattern other
  // print-enabled pages (results / admin fees) use.
  const schoolName =
    (user as unknown as { schoolName?: string; school_name?: string })
      ?.schoolName ||
    (user as unknown as { schoolName?: string; school_name?: string })
      ?.school_name ||
    "School";
  const principal =
    (user as unknown as { principal?: string })?.principal ||
    "Authorized Signatory";

  useEffect(() => {
    void run(async () => {
      const studentId = await resolveStudentId(user?.studentId);
      if (!studentId) throw new Error("No linked student found.");
      const result = await serviceRequest<FeesResponse>(
        `/api/parent/fees?student_id=${studentId}`,
      );
      if (!result.ok) throw new Error(result.error.message || "Failed to load fees");
      return result.data;
    }).catch(() => {
      // useSafeAsync already captures the error
    });
  }, [run, user?.studentId]);

  // ────────────────────────────────────────────────────────────────────
  // Derived: a single FeeReceiptStudent record reused by both print
  // helpers. Memoised so consecutive prints don't rebuild the object.
  // ────────────────────────────────────────────────────────────────────

  const printStudent: FeeReceiptStudent | null = useMemo(() => {
    if (state.status !== "success" || !state.data) return null;
    return {
      name: state.data.student,
      className: state.data.class,
      academicYear: state.data.academic_year,
    };
  }, [state]);

  // ────────────────────────────────────────────────────────────────────
  // Loading / error states
  // ────────────────────────────────────────────────────────────────────

  if (state.status === "idle" || state.status === "loading") {
    return (
      <SchoolShell eyebrow="Student Portal" title="Fees">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[80px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Student Portal" title="Fees">
        <DataState
          variant="error"
          title="Fee information unavailable"
          message={state.error}
        />
      </SchoolShell>
    );
  }

  const report = state.data;
  const summary = report.fee_summary;
  const recoveryPercent = Math.max(0, Math.min(100, summary.percentage_paid));
  const isPaidUp = summary.pending <= 0 && summary.total_fee > 0;

  // ────────────────────────────────────────────────────────────────────
  // Print actions
  // ────────────────────────────────────────────────────────────────────

  function handlePrintStatement() {
    if (!printStudent) return;
    exportFeeStatement(
      {
        student: printStudent,
        summary: {
          total_fee: summary.total_fee,
          collected: summary.collected,
          pending: summary.pending,
          percentage_paid: summary.percentage_paid,
          status: summary.status,
        },
        details: report.fee_details,
        payments: report.payment_history,
      },
      { schoolName, principal },
    );
  }

  function handlePrintReceipt(payment: FeesResponse["payment_history"][number]) {
    if (!printStudent) return;
    exportFeeReceipt(payment, printStudent, { schoolName, principal });
  }

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell eyebrow="Student Portal" title="Fees">
      {/* ── Hero strip ─────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Fee Ledger
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                isPaidUp
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : summary.pending > 0
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-slate-50 text-slate-500 border-slate-100"
              }`}
            >
              <AppIcon name={isPaidUp ? "check_circle" : "pending_actions"} size={12} />
              {isPaidUp ? "All paid" : summary.status}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {report.student}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="GraduationCap" size={14} />
              <span className="text-[11px] font-bold">{report.class}</span>
            </div>
            {report.academic_year ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="Calendar" size={14} />
                <span className="text-[11px] font-bold">{report.academic_year}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="Receipt" size={14} />
              <span className="text-[11px] font-bold">
                {report.fee_details.length} component
                {report.fee_details.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintStatement}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm no-print"
        >
          <AppIcon name="Printer" size={16} />
          Print Statement
        </button>

        <AppIcon name="CreditCard" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardCompact
          label="Total Fee"
          value={`Rs. ${summary.total_fee.toLocaleString()}`}
          icon="account_balance"
          accent="slate"
          hint="Across all invoices"
        />
        <StatCardCompact
          label="Collected"
          value={`Rs. ${summary.collected.toLocaleString()}`}
          icon="payments"
          accent="blue"
          hint={`${summary.percentage_paid}% recovered`}
        />
        <StatCardCompact
          label="Pending"
          value={`Rs. ${summary.pending.toLocaleString()}`}
          icon="pending_actions"
          accent={summary.pending > 0 ? "rose" : "emerald"}
          hint={summary.pending > 0 ? "Outstanding" : "Cleared"}
        />
        <StatCardCompact
          label="Paid %"
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
              Rs. {summary.collected.toLocaleString()} of Rs.{" "}
              {summary.total_fee.toLocaleString()} settled
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

          {report.fee_details.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {report.fee_details.map((fee, idx) => {
                const tone = statusTone(fee.status);
                return (
                  <div
                    key={`${fee.fee_type}-${fee.due_date}-${idx}`}
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
                          {fee.fee_type}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 truncate">
                          Due: {fee.due_date}
                          {fee.receipt_no ? ` · #${fee.receipt_no}` : ""}
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
              icon="receipt_long"
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
                Tap print to download a branded receipt
              </p>
            </div>
            <AppIcon name="History" size={16} className="text-slate-300" />
          </div>

          {report.payment_history.length > 0 ? (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              {report.payment_history.map((p) => (
                <div
                  key={p.receipt_no}
                  className="rounded-lg border border-slate-100 p-2.5 hover:border-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <AppIcon name="CheckCircle" size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate">
                          {p.receipt_no}
                        </p>
                        <p className="text-[9px] font-medium text-slate-400 truncate">
                          {p.date}
                          {p.method && p.method !== "—" ? ` · ${p.method}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-[12px] font-black text-blue-600 shrink-0 tabular-nums">
                      Rs. {p.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 truncate">
                      {p.fee_type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(p)}
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors no-print"
                    >
                      <AppIcon name="Printer" size={12} />
                      Print
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PremiumEmpty
              compact
              title="No payments yet"
              icon="history"
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
      return { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" };
    case "partial":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
      };
    case "overdue":
      return { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" };
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
  icon = "receipt_long",
}: {
  title: string;
  message: string;
  compact?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${compact ? "p-8" : "p-12"} text-center flex flex-col items-center justify-center`}
    >
      <div
        className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-full bg-white shadow-sm flex items-center justify-center mb-3`}
      >
        <AppIcon name={icon} className={` text-slate-300 ${compact ? "text-[20px]" : "text-[24px]"} `} />
      </div>
      <p
        className={`${compact ? "text-[12px]" : "text-[13px]"} font-black text-slate-700`}
      >
        {title}
      </p>
      <p
        className={`${compact ? "text-[10px]" : "text-[11px]"} text-slate-500 mt-1 max-w-sm`}
      >
        {message}
      </p>
    </div>
  );
}
