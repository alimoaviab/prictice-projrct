import { AppIcon } from "shared/ui/AppIcon";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Skeleton, ConfirmModal } from "@/components/ui";
import { useQuestionPapers } from "@/modules/question-papers/hooks/useQuestionPapers";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import type { QuestionPaper, PaperQuestion } from "@/modules/question-papers/types/questionPaper.types";
import { getQuestionTypeLabel, QUESTION_TYPES } from "@/data/question-types";

/**
 * Saved Papers Page
 * Clean white EduPlexo design - shows all saved question papers
 */

export function SavedPapersPage() {
  const navigate = useNavigate();
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
    <SchoolShell eyebrow="Question Papers" title="Saved Papers">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/question-papers"
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Saved Papers</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">View, download, and print your saved question papers</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200/80 px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
              <AppIcon name="FileText" size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-900">{filtered.length} Papers</p>
              <p className="text-[10px] text-slate-400">Total saved</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <AppIcon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search papers…"
                className="h-9 w-[200px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/question-papers/generator")}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <AppIcon name="Plus" size={14} />
              Generate New
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <AppIcon name="FileText" size={28} className="text-blue-300" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900 mb-1">
              {search ? "No matching papers" : "No saved papers yet"}
            </h3>
            <p className="text-[12px] text-slate-500 mb-5 text-center max-w-xs">
              {search ? "Try a different search term." : "Generate your first question paper and it will appear here."}
            </p>
            {!search && (
              <Link
                to="/admin/question-papers/generator"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <AppIcon name="Sparkles" size={14} />
                Generate Paper
              </Link>
            )}
          </div>
        )}

        {/* Papers Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((paper) => (
              <PaperCard
                key={paper._id}
                paper={paper}
                onPrint={() => handlePrint(paper)}
                onDelete={() => setPendingDelete(paper._id)}
              />
            ))}
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
    </SchoolShell>
  );
}

function PaperCard({ paper, onPrint, onDelete }: { paper: QuestionPaper; onPrint: () => void; onDelete: () => void }) {
  const questionsCount = getQuestionsCount(paper);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <AppIcon name="FileText" size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-bold text-slate-900 truncate">{paper.title}</h3>
          <p className="text-[10px] text-slate-400">
            {paper.date ? new Date(paper.date).toLocaleDateString() : new Date(paper.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {paper.class_name && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {paper.class_name}
          </span>
        )}
        {paper.subject_name && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
            {paper.subject_name}
          </span>
        )}
        {questionsCount > 0 && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
            {questionsCount} Qs
          </span>
        )}
      </div>

      {paper.teacher_name && (
        <p className="text-[10px] text-slate-400 mb-3 truncate">
          Teacher: <span className="text-slate-600">{paper.teacher_name}</span>
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
        <button
          onClick={onPrint}
          className="flex-1 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center gap-1.5 text-blue-600 text-[10px] font-bold hover:bg-blue-100 transition-colors"
        >
          <AppIcon name="Printer" size={13} />
          Print
        </button>
        <Link
          to={`/admin/question-papers/${paper._id}`}
          className="flex-1 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center gap-1.5 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition-colors"
        >
          <AppIcon name="Eye" size={13} />
          View
        </Link>
        <button
          onClick={onDelete}
          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
        >
          <AppIcon name="Trash2" size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function getQuestionsCount(paper: QuestionPaper): number {
  const raw: any = (paper as any).questions;
  if (Array.isArray(raw)) return raw.length;
  if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.length;
    } catch {/* ignore */}
  }
  return 0;
}

function printPaper(paper: QuestionPaper, schoolName: string) {
  let questions: PaperQuestion[] = [];
  const raw: any = (paper as any).questions;
  if (Array.isArray(raw)) {
    questions = raw;
  } else if (typeof raw === "string" && raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) questions = parsed;
    } catch {/* ignore */}
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const knownTypes = new Set(QUESTION_TYPES.map((type) => type.id));
  const grouped = [
    ...QUESTION_TYPES.map((type) => ({ id: type.id, title: type.label, questions: questions.filter((q) => q.type === type.id) })),
    ...[...new Set(questions.map((q) => q.type).filter((type) => !knownTypes.has(type)))].map((type) => ({
      id: type,
      title: getQuestionTypeLabel(type),
      questions: questions.filter((q) => q.type === type),
    })),
  ].filter((group) => group.questions.length > 0);

  const section = (title: string, list: PaperQuestion[], startIdx: number, includeOptions: boolean) => {
    if (list.length === 0) return "";
    const items = list
      .map((q, i) => {
        const idx = startIdx + i + 1;
        let html = `<div class="q"><strong>Q${idx}.</strong> ${q.question} <span class="m">(${q.marks} marks)</span></div>`;
        if (includeOptions && q.options && q.options.length > 0) {
          html += `<div class="opts">${q.options.map((o, oi) => `<div>(${String.fromCharCode(97 + oi)}) ${o}</div>`).join("")}</div>`;
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
  ${grouped.map((group) => {
    const startIdx = grouped.slice(0, grouped.indexOf(group)).reduce((sum, item) => sum + item.questions.length, 0);
    return section(group.title, group.questions, startIdx, group.id === "mcq");
  }).join("")}
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => { setTimeout(() => { w.focus(); w.print(); }, 200); };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
