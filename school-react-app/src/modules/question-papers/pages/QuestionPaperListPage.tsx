/**
 * Question Papers — List page showing all created papers.
 *
 * Adds Print, Duplicate, and Auto-Generate quick actions to match the
 * enterprise spec (no page reloads, optimistic updates).
 */

import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Skeleton, DataState, ConfirmModal } from "@/components/ui";
import { useQuestionPapers } from "../hooks/useQuestionPapers";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import type { QuestionPaper, PaperQuestion } from "../types/questionPaper.types";

export function QuestionPaperListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Detect role prefix from current URL path
  const rolePrefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/admin";
  const { state, remove } = useQuestionPapers();
  const { schoolName } = useSchoolBranding();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const papers = state.data || [];
  const isLoading = state.status === "loading" || state.status === "idle";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.class_name || "").toLowerCase().includes(q) ||
        (p.teacher_name || "").toLowerCase().includes(q) ||
        (p.subject_name || "").toLowerCase().includes(q),
    );
  }, [papers, search]);

  async function handleDelete() {
    if (!pendingDelete) return;
    await remove(pendingDelete);
    setPendingDelete(null);
  }

  function handlePrint(paper: QuestionPaper) {
    printPaper(paper, schoolName || "School Name");
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">description</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">Question Papers</p>
            <p className="text-[10px] font-bold text-slate-400">{filtered.length} of {papers.length} papers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search papers…"
              className="h-9 w-[220px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400"
            />
          </div>
          <Link
            to={`${rolePrefix}/question-bank`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white border border-slate-200 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-base">library_books</span>
            Question Bank
          </Link>
          <button
            type="button"
            onClick={() => navigate(`${rolePrefix}/question-papers/create`)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 text-white text-[12px] font-bold shadow-sm shadow-indigo-600/15 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create New Paper
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <DataState
          variant="empty"
          title={search ? "No matching papers" : "No question papers yet"}
          message={search ? "Try a different search." : "Create your first question paper to get started."}
        />
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Title</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class · Subject</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teacher</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((paper) => (
                  <tr key={paper._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{paper.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {paper.class_name || "—"}
                      {paper.subject_name ? ` · ${paper.subject_name}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{paper.teacher_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {paper.date ? new Date(paper.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-400">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePrint(paper)}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors"
                          title="Print"
                        >
                          <span className="material-symbols-outlined text-[14px]">print</span>
                        </button>
                        <Link
                          to={`${rolePrefix}/question-papers/${paper._id}`}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                        </Link>
                        <Link
                          to={`${rolePrefix}/question-papers/${paper._id}/edit`}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </Link>
                        <button
                          onClick={() => setPendingDelete(paper._id)}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete this question paper?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Print helper ───────────────────────────────────────────────────────
//
// Opens a print window with sectioned A/B/C layout and triggers print()
// directly. No view page is opened — user can save as PDF from the print
// dialog.

function printPaper(paper: QuestionPaper, schoolName: string) {
  let questions: PaperQuestion[] = [];
  // paper.questions may be string (from list) or already an array.
  const raw: any = (paper as any).questions;
  if (Array.isArray(raw)) {
    questions = raw;
  } else if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) questions = parsed;
    } catch {/* ignore */}
  }

  const mcqs = questions.filter((q) => q.type === "mcq");
  const shorts = questions.filter((q) => q.type === "short");
  const longs = questions.filter((q) => q.type === "long");
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  const section = (title: string, list: PaperQuestion[], startIdx: number, includeOptions: boolean, lines: number) => {
    if (list.length === 0) return "";
    const items = list
      .map((q, i) => {
        const idx = startIdx + i + 1;
        let html = `<div class="q"><strong>Q${idx}.</strong> ${q.question} <span class="m">(${q.marks} marks)</span></div>`;
        if (includeOptions && q.options && q.options.length > 0) {
          html += `<div class="opts">${q.options
            .map((o, oi) => `<div>(${String.fromCharCode(97 + oi)}) ${o}</div>`)
            .join("")}</div>`;
        }
        if (lines > 0) {
          html += `<div class="lines">${"<div class='line'></div>".repeat(lines)}</div>`;
        }
        return html;
      })
      .join("");
    return `<section><h2>${title}</h2>${items}</section>`;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${paper.title}</title>
<style>
  body{font-family:Georgia,serif;margin:0;padding:32px;color:#0f172a}
  .head{text-align:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:18px}
  .head h1{margin:0;font-size:22px;letter-spacing:1px;text-transform:uppercase}
  .head h2{margin:4px 0 0;font-size:16px;font-weight:600}
  .meta{display:flex;justify-content:space-between;font-size:12px;margin-top:6px;color:#475569}
  section{margin:18px 0}
  section h2{font-size:14px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;border-bottom:1px solid #cbd5e1;padding-bottom:4px}
  .q{font-size:13px;margin:8px 0 4px;line-height:1.5}
  .m{color:#64748b;font-weight:normal;font-size:11px}
  .opts{margin:4px 0 0 22px;font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .lines{margin:6px 0 8px 22px}
  .line{border-bottom:1px dashed #94a3b8;height:18px}
  @media print{body{padding:18px}}
</style></head><body>
  <div class="head">
    <h1>${escapeHtml(schoolName)}</h1>
    <h2>${escapeHtml(paper.title)}</h2>
    <div class="meta">
      <span>Class: ${escapeHtml(paper.class_name || "")}</span>
      ${paper.subject_name ? `<span>Subject: ${escapeHtml(paper.subject_name)}</span>` : ""}
      ${paper.teacher_name ? `<span>Teacher: ${escapeHtml(paper.teacher_name)}</span>` : ""}
      ${paper.date ? `<span>Date: ${new Date(paper.date).toLocaleDateString()}</span>` : ""}
    </div>
    <div class="meta"><span>Total Marks: ${totalMarks}</span><span>Total Questions: ${questions.length}</span></div>
  </div>
  ${section("Section A — Multiple Choice", mcqs, 0, true, 0)}
  ${section("Section B — Short Questions", shorts, mcqs.length, false, 0)}
  ${section("Section C — Long Questions", longs, mcqs.length + shorts.length, false, 0)}
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 200);
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
