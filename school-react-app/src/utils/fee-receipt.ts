/**
 * Real fee receipt + statement export.
 *
 * Companion to `marksheet.ts`. Generates printable HTML for two flows:
 *   - exportFeeReceipt(payment, options)   single-payment receipt
 *   - exportFeeStatement(report, options)  full ledger statement
 *
 * Both build a self-contained HTML document in a hidden iframe and trigger
 * `window.print()` so users can save as PDF or send to a physical printer
 * without any third-party dependency. The visual language matches the
 * marksheet template (same letterhead, typography, spacing) so school-
 * branded documents feel like a single family.
 */

// ────────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────────

export interface FeeReceiptOptions {
  /** School name printed on the header. Defaults to "School". */
  schoolName?: string;
  /** Optional school logo shown in the header and voucher cards. */
  logoUrl?: string;
  /** Optional school address line under the name. */
  schoolAddress?: string;
  /** Optional principal name printed in the signature row. */
  principal?: string;
  /** Currency prefix, defaults to "Rs." */
  currency?: string;
}

export interface FeeReceiptPayment {
  receipt_no: string;
  date: string;
  amount: number;
  fee_type: string;
  method: string;
  status: string;
}

export interface FeeReceiptStudent {
  /** Student display name. */
  name: string;
  /** Class + section, e.g. "Grade 8 - A". */
  className: string;
  /** Roll number / admission number. */
  rollNo?: string;
  /** Academic year string. */
  academicYear?: string;
}

export interface FeeStatementSummary {
  total_fee: number;
  collected: number;
  pending: number;
  percentage_paid: number;
  status: string;
}

export interface FeeStatementDetail {
  fee_type: string;
  amount: number;
  due_date: string;
  status: string;
  payment_date?: string | null;
  receipt_no?: string | null;
}

export interface FeeStatementInput {
  student: FeeReceiptStudent;
  summary: FeeStatementSummary;
  details: FeeStatementDetail[];
  payments: FeeReceiptPayment[];
}

// ────────────────────────────────────────────────────────────────────────
// Internal helpers — escape, format, base styles, print frame.
// Kept separate from `marksheet.ts` so the two utilities can evolve
// independently without coupling.
// ────────────────────────────────────────────────────────────────────────

function htmlEscape(s: string | number | undefined | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtMoney(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${safe.toLocaleString()}`;
}

function fmtToday(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function statusTone(status: string): { bg: string; fg: string } {
  const s = status.toLowerCase();
  if (s === "paid")
    return { bg: "#dbeafe", fg: "#1d4ed8" }; // blue
  if (s === "partial")
    return { bg: "#dcfce7", fg: "#15803d" }; // emerald
  if (s === "overdue" || s === "failed")
    return { bg: "#fee2e2", fg: "#b91c1c" }; // rose
  return { bg: "#fef3c7", fg: "#b45309" }; // amber default
}

const baseStyles = `
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background: #fff;
  }
  .sheet {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px 28px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 16px;
    gap: 16px;
  }
  .header .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .header h1 {
    margin: 0;
    font-size: 20px;
    letter-spacing: 0.4px;
    line-height: 1.1;
  }
  .school-logo {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    flex: none;
  }
  .header .school-meta {
    font-size: 11px;
    color: #475569;
    margin-top: 4px;
  }
  .header .badge {
    text-align: right;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #2563eb;
    text-transform: uppercase;
  }
  .header .receipt-meta {
    text-align: right;
    font-size: 10px;
    color: #475569;
    margin-top: 4px;
    line-height: 1.5;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 24px;
    margin-bottom: 16px;
    font-size: 12px;
  }
  .summary-grid .label {
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 9px;
    font-weight: 700;
  }
  .summary-grid .value {
    color: #0f172a;
    font-weight: 600;
    margin-top: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
  }
  thead th {
    background: #f1f5f9;
    color: #0f172a;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #cbd5e1;
  }
  tbody td {
    padding: 10px 12px;
    font-size: 12px;
    border-bottom: 1px solid #e2e8f0;
  }
  tbody tr:last-child td { border-bottom: none; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  .totals {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .totals .stat {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
  }
  .totals .stat .lbl {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 700;
  }
  .totals .stat .val {
    font-size: 18px;
    font-weight: 700;
    margin-top: 6px;
    color: #0f172a;
  }
  .total-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    gap: 24px;
    align-items: flex-end;
  }
  .total-row .grand {
    text-align: right;
  }
  .total-row .grand .lbl {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 700;
  }
  .total-row .grand .val {
    font-size: 26px;
    font-weight: 800;
    margin-top: 4px;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-size: 11px;
    color: #475569;
  }
  .signature {
    border-top: 1px solid #94a3b8;
    padding-top: 6px;
    width: 220px;
    text-align: center;
    font-weight: 600;
  }
  .note {
    margin-top: 12px;
    padding: 10px 14px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    font-size: 10px;
    color: #475569;
    line-height: 1.5;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { padding: 12px; }
    .no-print { display: none; }
  }
</style>
`;

function renderHeader(
  opts: FeeReceiptOptions,
  badge: string,
  rightExtra?: string,
): string {
  return `
    <div class="header">
      <div class="brand">
        ${opts.logoUrl || "/logo.jpeg"
          ? `<img class="school-logo" src="${htmlEscape(opts.logoUrl || "/logo.jpeg")}" alt="${htmlEscape(opts.schoolName || "School")} logo" />`
          : ""}
        <div>
          <h1>${htmlEscape(opts.schoolName || "School")}</h1>
        <div class="school-meta">${htmlEscape(opts.schoolAddress || "Official Fee Document")}</div>
      </div>
      <div>
        <div class="badge">${htmlEscape(badge)}</div>
        ${rightExtra || ""}
      </div>
    </div>
  `;
}

function renderFooter(opts: FeeReceiptOptions): string {
  return `
    <div class="footer">
      <div>
        <div>Issued on ${htmlEscape(fmtToday())}</div>
        <div style="margin-top:4px;color:#94a3b8;font-size:10px;">
          This is a system-generated document. No physical signature required.
        </div>
      </div>
      <div class="signature">${htmlEscape(opts.principal || "Authorized Signatory")}</div>
    </div>
  `;
}

function renderStudentBlock(student: FeeReceiptStudent): string {
  return `
    <div class="summary-grid">
      <div>
        <div class="label">Student</div>
        <div class="value">${htmlEscape(student.name)}</div>
      </div>
      <div>
        <div class="label">Class</div>
        <div class="value">${htmlEscape(student.className)}</div>
      </div>
      ${student.rollNo
        ? `<div>
            <div class="label">Roll / Admission</div>
            <div class="value">${htmlEscape(student.rollNo)}</div>
          </div>`
        : ""}
      ${student.academicYear
        ? `<div>
            <div class="label">Academic Year</div>
            <div class="value">${htmlEscape(student.academicYear)}</div>
          </div>`
        : ""}
    </div>
  `;
}

function renderStatusPill(status: string): string {
  const tone = statusTone(status);
  return `
    <span class="pill" style="background:${tone.bg};color:${tone.fg};">
      ${htmlEscape(status || "—")}
    </span>
  `;
}

/**
 * Open a hidden iframe, write the supplied HTML, and trigger the browser
 * print dialog. Cleans up the iframe after a short delay so the dialog has
 * time to spawn before tear-down.
 */
function printHtmlDocument(html: string, title: string): void {
  if (typeof window === "undefined") return;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("title", title);
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.opacity = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    document.body.removeChild(frame);
    // Last-resort fallback: open in a new window.
    const popup = window.open("", "_blank");
    if (popup) {
      popup.document.write(html);
      popup.document.close();
      popup.focus();
      popup.print();
    }
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const trigger = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (frame.parentNode) frame.parentNode.removeChild(frame);
      }, 1000);
    }
  };

  if (frame.contentWindow?.document.readyState === "complete") {
    trigger();
  } else {
    frame.addEventListener("load", trigger, { once: true });
  }
}

// ────────────────────────────────────────────────────────────────────────
// Public exports
// ────────────────────────────────────────────────────────────────────────

/**
 * Single-payment receipt — used by the "Print" action on every payment row
 * in the fee history list.
 */
export function exportFeeReceipt(
  payment: FeeReceiptPayment,
  student: FeeReceiptStudent,
  opts: FeeReceiptOptions = {},
): void {
  const currency = opts.currency || "Rs.";
  const tone = statusTone(payment.status);

  const rightExtra = `
    <div class="receipt-meta">
      <div><strong>Receipt No.</strong> ${htmlEscape(payment.receipt_no || "—")}</div>
      <div><strong>Date</strong> ${htmlEscape(payment.date || fmtToday())}</div>
    </div>
  `;

  const html = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8" />
    <title>Fee Receipt — ${htmlEscape(payment.receipt_no || student.name)}</title>
    ${baseStyles}
  </head><body>
    <div class="sheet">
      ${renderHeader(opts, "Fee Receipt", rightExtra)}
      ${renderStudentBlock(student)}

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Method</th>
            <th>Status</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${htmlEscape(payment.fee_type || "Fee Payment")}</td>
            <td>${htmlEscape(payment.method || "—")}</td>
            <td>
              <span class="pill" style="background:${tone.bg};color:${tone.fg};">
                ${htmlEscape(payment.status || "paid")}
              </span>
            </td>
            <td class="amount">${fmtMoney(payment.amount, currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-row">
        <div class="grand">
          <div class="lbl">Amount Paid</div>
          <div class="val">${fmtMoney(payment.amount, currency)}</div>
        </div>
      </div>

      <div class="note">
        Please retain this receipt as proof of payment. For any queries
        regarding this transaction, contact the school accounts office and
        quote the receipt number above.
      </div>

      ${renderFooter(opts)}
    </div>
  </body></html>`;

  printHtmlDocument(html, `Receipt ${payment.receipt_no}`);
}

/**
 * Full ledger statement — used by the page-level "Print Statement" button.
 * Lists every fee component and every payment under one branded document.
 */
export function exportFeeStatement(
  input: FeeStatementInput,
  opts: FeeReceiptOptions = {},
): void {
  const currency = opts.currency || "Rs.";
  const { student, summary, details, payments } = input;

  const detailRows = details
    .map(
      (d) => `
        <tr>
          <td>${htmlEscape(d.fee_type)}</td>
          <td>${htmlEscape(d.due_date || "—")}</td>
          <td>${renderStatusPill(d.status)}</td>
          <td>${htmlEscape(d.receipt_no || "—")}</td>
          <td class="amount">${fmtMoney(d.amount, currency)}</td>
        </tr>
      `,
    )
    .join("");

  const paymentRows = payments
    .map(
      (p) => `
        <tr>
          <td>${htmlEscape(p.receipt_no)}</td>
          <td>${htmlEscape(p.date)}</td>
          <td>${htmlEscape(p.fee_type)}</td>
          <td>${htmlEscape(p.method || "—")}</td>
          <td class="amount">${fmtMoney(p.amount, currency)}</td>
        </tr>
      `,
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8" />
    <title>Fee Statement — ${htmlEscape(student.name)}</title>
    ${baseStyles}
  </head><body>
    <div class="sheet">
      ${renderHeader(opts, "Fee Statement")}
      ${renderStudentBlock(student)}

      <div class="totals">
        <div class="stat">
          <div class="lbl">Total Fee</div>
          <div class="val">${fmtMoney(summary.total_fee, currency)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Collected</div>
          <div class="val">${fmtMoney(summary.collected, currency)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Pending</div>
          <div class="val">${fmtMoney(summary.pending, currency)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Paid %</div>
          <div class="val">${Number(summary.percentage_paid || 0)}%</div>
        </div>
      </div>

      <h3 style="margin-top:32px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#475569;">
        Fee Components
      </h3>
      <table>
        <thead>
          <tr>
            <th>Fee Type</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Receipt</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${detailRows || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;font-size:11px;padding:18px 0;">No fee components recorded.</td></tr>`}
        </tbody>
      </table>

      <h3 style="margin-top:32px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#475569;">
        Payment History
      </h3>
      <table>
        <thead>
          <tr>
            <th>Receipt No.</th>
            <th>Date</th>
            <th>Fee Type</th>
            <th>Method</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows || `<tr><td colspan="5" style="text-align:center;color:#94a3b8;font-size:11px;padding:18px 0;">No payments recorded yet.</td></tr>`}
        </tbody>
      </table>

      <div class="total-row">
        <div class="grand">
          <div class="lbl">Outstanding Balance</div>
          <div class="val">${fmtMoney(summary.pending, currency)}</div>
        </div>
      </div>

      <div class="note">
        This statement reflects fees as of ${htmlEscape(fmtToday())}. For
        the most up-to-date balance please refer to the school portal or
        contact the accounts office.
      </div>

      ${renderFooter(opts)}
    </div>
  </body></html>`;

  printHtmlDocument(html, `Fee Statement ${student.name}`);
}


// ────────────────────────────────────────────────────────────────────────
// Bulk fee report — one student per A4 page
// ────────────────────────────────────────────────────────────────────────

/**
 * A single ledger entry as rendered on a per-student page in the bulk
 * report. Mirrors the shape used by `LedgerEntry` on the admin fee
 * dashboard so the page can pass rows through with minimal mapping.
 */
export interface FeeBulkEntry {
  student: {
    id: string;
    name: string;
    admission_no?: string;
    class_name?: string;
    section?: string;
    roll_no?: string;
    parent_name?: string;
    parent_phone?: string;
  };
  /** Period of this ledger snapshot, e.g. "October 2026". */
  period?: string;
  monthly_fee: number;
  carry_forward: number;
  total_payable: number;
  paid_total: number;
  remaining: number;
  status: string;
  /**
   * Optional breakdown of what makes up the monthly fee — Tuition / Bus /
   * Lab / etc. When provided the page renders a line-item table; when
   * omitted the page just shows the totals block.
   */
  components?: Array<{
    fee_type: string;
    amount: number;
    is_optional?: boolean;
    note?: string;
  }>;
  /** Optional per-student payment history for this period. */
  payments?: FeeReceiptPayment[];
}

export interface FeeBulkReportOptions extends FeeReceiptOptions {
  /** Defaults to "Fee Report — <period>" if omitted. */
  title?: string;
  /** Period label. */
  period?: string;
  /** Academic year. */
  academicYear?: string;
  /** Number of student vouchers per printed page. */
  studentsPerPage?: 1 | 2 | 3 | 4;
  /** Paper size for browser print preset. */
  paperSize?: "A4" | "Letter" | "Legal";
  /** Print orientation. */
  orientation?: "portrait" | "landscape";
  /** Compact visual density for multi-voucher pages. */
  compactMode?: boolean;
  /** Toggle long note block in vouchers. */
  includeNotes?: boolean;
}

/**
 * Render a multi-page fee report with one student per page. The browser
 * print dialog opens with paper preset to A4 / Portrait so admins can save
 * a single PDF that contains every selected student's invoice.
 */
export function exportFeeBulkReport(
  entries: FeeBulkEntry[],
  opts: FeeBulkReportOptions = {},
): void {
  if (!entries.length) return;
  const currency = opts.currency || "Rs.";
  const period = opts.period || entries[0]?.period || fmtToday();
  const studentsPerPage = Math.min(4, Math.max(1, Number(opts.studentsPerPage || 1))) as 1 | 2 | 3 | 4;
  const orientation: "portrait" | "landscape" =
    studentsPerPage >= 3 ? "landscape" : (opts.orientation || "portrait");
  const paperSize = opts.paperSize || "A4";
  const compactMode = opts.compactMode ?? studentsPerPage >= 3;
  const title =
    opts.title || `Fee Report — ${period}${entries.length > 1 ? ` (${entries.length} students)` : ""}`;

  const pageGroups: FeeBulkEntry[][] = [];
  for (let i = 0; i < entries.length; i += studentsPerPage) {
    pageGroups.push(entries.slice(i, i + studentsPerPage));
  }

  const pages =
    studentsPerPage === 1
      ? entries
          .map((entry, idx) => renderBulkEntryPage(entry, currency, opts, idx + 1, entries.length))
          .join("")
      : pageGroups
          .map((group, idx) =>
            renderBulkGridPage(group, currency, opts, idx + 1, pageGroups.length, studentsPerPage, compactMode),
          )
          .join("");

  const html = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8" />
    <title>${htmlEscape(title)}</title>
    ${baseStyles}
    <style>
      /* Bulk report: one student per printed page. */
      .page {
        page-break-after: always;
        break-after: page;
      }
      .page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      @page {
        size: ${paperSize} ${orientation};
        margin: ${studentsPerPage >= 3 ? "8mm" : "12mm"};
      }
      .page-meta {
        text-align: right;
        font-size: 9px;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 1.4px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .balance-card {
        margin-top: 16px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      .balance-card .b-cell .lbl {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        color: #64748b;
      }
      .balance-card .b-cell .val {
        font-size: 16px;
        font-weight: 800;
        margin-top: 4px;
        color: #0f172a;
      }
      .balance-card .b-cell.total .val { color: #2563eb; }
      .balance-card .b-cell.paid .val { color: #15803d; }
      .balance-card .b-cell.due .val { color: #b91c1c; }
      .sheet {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      .voucher-grid {
        display: grid;
        gap: ${studentsPerPage >= 3 ? "12px" : "16px"};
      }
      .voucher-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .voucher-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .voucher-grid.four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .voucher-mini {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: ${studentsPerPage >= 3 ? "6px" : "8px"};
      }
      .voucher-mini .mini-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      .voucher-mini .mini-logo {
        width: 26px;
        height: 26px;
        border-radius: 7px;
        object-fit: cover;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        flex: none;
      }
      .voucher-mini .mini-school {
        min-width: 0;
      }
      .voucher-mini .mini-school-name {
        font-size: 11px;
        font-weight: 800;
        line-height: 1.15;
      }
      .voucher-mini .mini-school-meta {
        font-size: 8px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
        margin-top: 2px;
      }
      .voucher-mini .mini-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      .voucher-mini .mini-title {
        font-size: 11px;
        font-weight: 800;
      }
      .voucher-mini .mini-sub {
        font-size: 8px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
      }
      .voucher-mini table thead th,
      .voucher-mini table tbody td {
        font-size: ${compactMode ? "8px" : "9px"};
        padding: ${compactMode ? "4px 5px" : "5px 6px"};
      }
      .voucher-mini .mini-metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
        margin-top: 5px;
      }
      .voucher-mini .mini-metrics .cell {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 4px;
      }
      .voucher-mini .mini-metrics .lbl {
        font-size: 8px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 700;
      }
      .voucher-mini .mini-metrics .val {
        margin-top: 2px;
        font-size: 10px;
        font-weight: 800;
      }
    </style>
  </head><body>
    ${pages}
  </body></html>`;

  printHtmlDocument(html, title);
}

function renderBulkGridPage(
  entries: FeeBulkEntry[],
  currency: string,
  opts: FeeBulkReportOptions,
  pageNum: number,
  pageTotal: number,
  studentsPerPage: 2 | 3 | 4,
  compactMode: boolean,
): string {
  const gridClass = studentsPerPage === 2 ? "two" : studentsPerPage === 3 ? "three" : "four";
  return `
    <div class="page">
      <div class="sheet">
        <div class="page-meta">Page ${pageNum} of ${pageTotal}</div>
        ${renderHeader(opts, "Fee Vouchers", `<div class="receipt-meta"><div><strong>Period</strong> ${htmlEscape(opts.period || fmtToday())}</div><div><strong>Generated</strong> ${htmlEscape(fmtToday())}</div></div>`)}
        <div class="voucher-grid ${gridClass}">
          ${entries.map((entry) => renderCompactVoucher(entry, currency, opts, compactMode)).join("")}
        </div>
        ${renderFooter(opts)}
      </div>
    </div>
  `;
}

function renderCompactVoucher(
  entry: FeeBulkEntry,
  currency: string,
  opts: FeeBulkReportOptions,
  compactMode: boolean,
): string {
  const tone = statusTone(entry.status);
  const componentRows = (entry.components ?? [])
    .slice(0, compactMode ? 4 : 6)
    .map(
      (c) => `
      <tr>
        <td>${htmlEscape(c.fee_type)}</td>
        <td class="amount">${fmtMoney(c.amount, currency)}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="voucher-mini">
      <div class="mini-brand">
        <img class="mini-logo" src="${htmlEscape(opts.logoUrl || "/logo.jpeg")}" alt="${htmlEscape(opts.schoolName || "School")} logo" />
        <div class="mini-school">
          <div class="mini-school-name">${htmlEscape(opts.schoolName || "School")}</div>
          <div class="mini-school-meta">${htmlEscape(opts.schoolAddress || "Official Fee Document")}</div>
        </div>
      </div>
      <div class="mini-head">
        <div>
          <div class="mini-title">${htmlEscape(entry.student.name)}</div>
          <div class="mini-sub">${htmlEscape(entry.student.class_name || "—")} · #${htmlEscape(entry.student.admission_no || "—")}</div>
        </div>
        ${renderStatusPill(entry.status)}
      </div>
      <table>
        <thead>
          <tr>
            <th>Fee Type</th>
            <th class="amount">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${componentRows || `
            <tr><td>Monthly Fee</td><td class="amount">${fmtMoney(entry.monthly_fee, currency)}</td></tr>
            <tr><td>Carry Forward</td><td class="amount">${fmtMoney(entry.carry_forward, currency)}</td></tr>
          `}
        </tbody>
      </table>

      <div class="mini-metrics">
        <div class="cell"><div class="lbl">Total</div><div class="val">${fmtMoney(entry.total_payable, currency)}</div></div>
        <div class="cell"><div class="lbl">Paid</div><div class="val">${fmtMoney(entry.paid_total, currency)}</div></div>
        <div class="cell"><div class="lbl">Due</div><div class="val">${fmtMoney(entry.remaining, currency)}</div></div>
        <div class="cell"><div class="lbl">Period</div><div class="val">${htmlEscape(entry.period || opts.period || "—")}</div></div>
      </div>

      ${opts.includeNotes === false
        ? ""
        : `<div class="note" style="margin-top:8px;padding:8px 10px;font-size:9px;">Please pay before due date to avoid late fee.</div>`}
    </div>
  `;
}

function renderBulkEntryPage(
  entry: FeeBulkEntry,
  currency: string,
  opts: FeeBulkReportOptions,
  pageNum: number,
  pageTotal: number,
): string {
  const tone = statusTone(entry.status);
  const rightExtra = `
    <div class="receipt-meta">
      <div><strong>Period</strong> ${htmlEscape(entry.period || opts.period || fmtToday())}</div>
      ${opts.academicYear
        ? `<div><strong>Academic Year</strong> ${htmlEscape(opts.academicYear)}</div>`
        : ""}
      <div><strong>Generated</strong> ${htmlEscape(fmtToday())}</div>
    </div>
  `;

  const studentMeta: FeeReceiptStudent = {
    name: entry.student.name,
    className: [entry.student.class_name, entry.student.section]
      .filter(Boolean)
      .join(" - ") || "—",
    rollNo: entry.student.admission_no || entry.student.roll_no,
    academicYear: opts.academicYear,
  };

  const componentRows = (entry.components ?? [])
    .map(
      (c) => `
      <tr>
        <td>${htmlEscape(c.fee_type)}${c.is_optional ? ' <span class="pill" style="background:#e0e7ff;color:#4338ca;margin-left:6px;">Optional</span>' : ""}</td>
        <td>${htmlEscape(c.note || "—")}</td>
        <td class="amount">${fmtMoney(c.amount, currency)}</td>
      </tr>`,
    )
    .join("");

  const paymentRows = (entry.payments ?? [])
    .map(
      (p) => `
      <tr>
        <td>${htmlEscape(p.receipt_no || "—")}</td>
        <td>${htmlEscape(p.date)}</td>
        <td>${htmlEscape(p.method || "—")}</td>
        <td class="amount">${fmtMoney(p.amount, currency)}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="page">
      <div class="sheet">
        <div class="page-meta">Page ${pageNum} of ${pageTotal}</div>
        ${renderHeader(opts, "Fee Invoice", rightExtra)}
        ${renderStudentBlock(studentMeta)}

        ${entry.student.parent_name || entry.student.parent_phone
          ? `<div class="summary-grid" style="margin-top:-12px;">
              ${entry.student.parent_name ? `<div><div class="label">Guardian</div><div class="value">${htmlEscape(entry.student.parent_name)}</div></div>` : ""}
              ${entry.student.parent_phone ? `<div><div class="label">Guardian Phone</div><div class="value">${htmlEscape(entry.student.parent_phone)}</div></div>` : ""}
            </div>`
          : ""}

        <div style="display:flex;justify-content:flex-end;margin-bottom:8px;">
          <span class="pill" style="background:${tone.bg};color:${tone.fg};">
            ${htmlEscape(entry.status || "Unpaid")}
          </span>
        </div>

        ${componentRows
          ? `
          <h3 style="margin-top:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#475569;">Fee Components</h3>
          <table>
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Note</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>${componentRows}</tbody>
          </table>`
          : `
          <h3 style="margin-top:0;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#475569;">Monthly Charges</h3>
          <table>
            <tbody>
              <tr>
                <td>Monthly Fee (${htmlEscape(entry.period || opts.period || "")})</td>
                <td class="amount">${fmtMoney(entry.monthly_fee, currency)}</td>
              </tr>
              <tr>
                <td>Previous Carry-Forward</td>
                <td class="amount">${fmtMoney(entry.carry_forward, currency)}</td>
              </tr>
            </tbody>
          </table>`}

        <div class="balance-card">
          <div class="b-cell"><div class="lbl">Monthly Fee</div><div class="val">${fmtMoney(entry.monthly_fee, currency)}</div></div>
          <div class="b-cell"><div class="lbl">Previous Due</div><div class="val">${fmtMoney(entry.carry_forward, currency)}</div></div>
          <div class="b-cell paid"><div class="lbl">Paid</div><div class="val">${fmtMoney(entry.paid_total, currency)}</div></div>
          <div class="b-cell ${entry.remaining > 0 ? "due" : "total"}"><div class="lbl">Outstanding</div><div class="val">${fmtMoney(entry.remaining, currency)}</div></div>
        </div>

        ${paymentRows
          ? `
          <h3 style="margin-top:24px;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#475569;">Payment History</h3>
          <table>
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Method</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>${paymentRows}</tbody>
          </table>`
          : ""}

        <div class="total-row">
          <div class="grand">
            <div class="lbl">Total Payable</div>
            <div class="val">${fmtMoney(entry.remaining, currency)}</div>
          </div>
        </div>

        <div class="note">
          Please remit the outstanding amount before the due date. Bring this
          invoice to the accounts office or pay via the school portal. For
          queries contact the accounts desk and quote the admission number
          ${htmlEscape(entry.student.admission_no || "")}.
        </div>

        ${renderFooter(opts)}
      </div>
    </div>
  `;
}
