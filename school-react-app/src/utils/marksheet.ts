/**
 * Real marksheet export.
 *
 * Replaces the legacy `alert("Exam: ...")` placeholder on the results
 * list. Uses the browser's print pipeline so the school can save a PDF
 * or print on letterhead with no third-party dependency.
 *
 * Two entry points:
 *   - exportMarksheet(result, options)        single-result transcript
 *   - exportExamMarksheet(rows, options)      all results for one exam
 *
 * Both build a self-contained HTML document in a hidden iframe and
 * trigger window.print(). The user picks "Save as PDF" or sends to a
 * physical printer. The iframe is removed after a short delay so the
 * print dialog has time to render.
 */

import type { ResultRow } from "@/modules/results/types/result.types";

export interface MarksheetOptions {
  /** School name printed on the header. Defaults to "School". */
  schoolName?: string;
  /** Optional school address line. */
  schoolAddress?: string;
  /** Optional principal name printed in the signature row. */
  principal?: string;
}

function gradeForRatio(ratio: number): { letter: string; band: string } {
  const pct = ratio * 100;
  if (pct >= 90) return { letter: "A+", band: "Outstanding" };
  if (pct >= 80) return { letter: "A", band: "Excellent" };
  if (pct >= 70) return { letter: "B", band: "Very Good" };
  if (pct >= 60) return { letter: "C", band: "Good" };
  if (pct >= 50) return { letter: "D", band: "Satisfactory" };
  return { letter: "F", band: "Needs Improvement" };
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
    padding: 40px 48px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header h1 {
    margin: 0;
    font-size: 22px;
    letter-spacing: 0.5px;
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
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 24px;
    margin-bottom: 24px;
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
    margin-top: 16px;
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
  .totals {
    margin-top: 24px;
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
  .footer {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
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
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sheet { padding: 20px; }
    .no-print { display: none; }
  }
</style>
`;

function htmlEscape(s: string | number | undefined | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHeader(opts: MarksheetOptions, badge: string): string {
  return `
    <div class="header">
      <div>
        <h1>${htmlEscape(opts.schoolName || "School")}</h1>
        <div class="school-meta">${htmlEscape(opts.schoolAddress || "Academic Transcript")}</div>
      </div>
      <div class="badge">${htmlEscape(badge)}</div>
    </div>
  `;
}

function renderFooter(opts: MarksheetOptions): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `
    <div class="footer">
      <div>Issued on ${htmlEscape(today)}</div>
      <div class="signature">${htmlEscape(opts.principal || "Principal Signature")}</div>
    </div>
  `;
}

/**
 * Open a hidden iframe with the supplied HTML and trigger the browser
 * print dialog. The user picks "Save as PDF" or sends to a printer.
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
      // Give the print dialog time to spawn before tearing down.
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

/** Single-student transcript for one exam result. */
export function exportMarksheet(row: ResultRow, opts: MarksheetOptions = {}): void {
  const ratio = row.max_marks > 0 ? row.obtained_marks / row.max_marks : 0;
  const grade = row.grade || gradeForRatio(ratio).letter;
  const band = gradeForRatio(ratio).band;
  const percent = Math.round(ratio * 100);

  const html = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8" />
    <title>Marksheet — ${htmlEscape(row.student_name)}</title>
    ${baseStyles}
  </head><body>
    <div class="sheet">
      ${renderHeader(opts, "Examination Transcript")}

      <div class="summary-grid">
        <div>
          <div class="label">Student</div>
          <div class="value">${htmlEscape(row.student_name)}</div>
        </div>
        <div>
          <div class="label">Admission No.</div>
          <div class="value">${htmlEscape(row.admission_no)}</div>
        </div>
        <div>
          <div class="label">Class</div>
          <div class="value">${htmlEscape(row.class_name)}</div>
        </div>
        <div>
          <div class="label">Issued</div>
          <div class="value">${htmlEscape(
            new Date(row.graded_at || Date.now()).toLocaleDateString()
          )}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Examination</th>
            <th>Max Marks</th>
            <th>Obtained</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${row.subjects && row.subjects.length > 0
            ? row.subjects.map((s) => {
                const isAbsent = s.obtained_marks === -1;
                const hasMarks = s.obtained_marks !== undefined && s.obtained_marks !== null;
                const pct = hasMarks && s.max_marks && s.max_marks > 0 && !isAbsent
                  ? Math.round((s.obtained_marks / s.max_marks) * 100)
                  : 0;
                const subGrade = hasMarks && !isAbsent && s.max_marks && s.max_marks > 0 ? gradeForRatio(s.obtained_marks / s.max_marks).letter : "—";
                return `
                  <tr>
                    <td>${htmlEscape(s.subject_name)}</td>
                    <td>${htmlEscape(row.exam_title)}</td>
                    <td>${htmlEscape(s.max_marks || 0)}</td>
                    <td>${hasMarks ? (isAbsent ? "Absent" : htmlEscape(s.obtained_marks)) : "Not Graded"}</td>
                    <td>${hasMarks ? (isAbsent ? "0%" : `${pct}%`) : "—"}</td>
                    <td>${htmlEscape(subGrade)}</td>
                    <td>—</td>
                  </tr>
                `;
              }).join("")
            : `
              <tr>
                <td>${htmlEscape(row.exam_subject)}</td>
                <td>${htmlEscape(row.exam_title)}</td>
                <td>${htmlEscape(row.max_marks)}</td>
                <td>${htmlEscape(row.obtained_marks)}</td>
                <td>${percent}%</td>
                <td>${htmlEscape(grade)}</td>
                <td>${htmlEscape(row.remarks || "—")}</td>
              </tr>
            `
          }
        </tbody>
      </table>

      <div class="totals">
        <div class="stat">
          <div class="lbl">Obtained</div>
          <div class="val">${htmlEscape(row.obtained_marks)} / ${htmlEscape(row.max_marks)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Percentage</div>
          <div class="val">${percent}%</div>
        </div>
        <div class="stat">
          <div class="lbl">Grade</div>
          <div class="val">${htmlEscape(grade)}</div>
        </div>
        <div class="stat">
          <div class="lbl">Performance</div>
          <div class="val">${htmlEscape(band)}</div>
        </div>
      </div>

      ${renderFooter(opts)}
    </div>
  </body></html>`;

  printHtmlDocument(html, `Marksheet ${row.student_name}`);
}

/** Multi-student marksheet for an entire exam. */
export function exportExamMarksheet(rows: ResultRow[], opts: MarksheetOptions = {}): void {
  if (rows.length === 0) return;
  const exam = rows[0];

  const tableBody = rows
    .map((r, i) => {
      const ratio = r.max_marks > 0 ? r.obtained_marks / r.max_marks : 0;
      const grade = r.grade || gradeForRatio(ratio).letter;
      const pct = Math.round(ratio * 100);
      return `<tr>
        <td>${i + 1}</td>
        <td>${htmlEscape(r.student_name)}</td>
        <td>${htmlEscape(r.admission_no)}</td>
        <td>${htmlEscape(r.obtained_marks)} / ${htmlEscape(r.max_marks)}</td>
        <td>${pct}%</td>
        <td>${htmlEscape(grade)}</td>
        <td>${htmlEscape(r.remarks || "—")}</td>
      </tr>`;
    })
    .join("");

  const totalMarks = rows.reduce((acc, r) => acc + r.obtained_marks, 0);
  const maxMarks = rows.reduce((acc, r) => acc + r.max_marks, 0);
  const overallPct = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
  const passed = rows.filter((r) => (r.grade || "").toUpperCase() !== "F").length;

  const html = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="utf-8" />
    <title>Exam Marksheet — ${htmlEscape(exam.exam_title)}</title>
    ${baseStyles}
  </head><body>
    <div class="sheet">
      ${renderHeader(opts, "Class Marksheet")}

      <div class="summary-grid">
        <div>
          <div class="label">Examination</div>
          <div class="value">${htmlEscape(exam.exam_title)}</div>
        </div>
        <div>
          <div class="label">Subject</div>
          <div class="value">${htmlEscape(exam.exam_subject)}</div>
        </div>
        <div>
          <div class="label">Class</div>
          <div class="value">${htmlEscape(exam.class_name)}</div>
        </div>
        <div>
          <div class="label">Students</div>
          <div class="value">${rows.length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Admission</th>
            <th>Marks</th>
            <th>Percentage</th>
            <th>Grade</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>

      <div class="totals">
        <div class="stat">
          <div class="lbl">Total</div>
          <div class="val">${totalMarks} / ${maxMarks}</div>
        </div>
        <div class="stat">
          <div class="lbl">Class Avg</div>
          <div class="val">${overallPct}%</div>
        </div>
        <div class="stat">
          <div class="lbl">Passed</div>
          <div class="val">${passed}</div>
        </div>
        <div class="stat">
          <div class="lbl">Failed</div>
          <div class="val">${rows.length - passed}</div>
        </div>
      </div>

      ${renderFooter(opts)}
    </div>
  </body></html>`;

  printHtmlDocument(html, `Exam Marksheet ${exam.exam_title}`);
}
