/**
 * Question Bank — Main page with filters, search, star/archive actions.
 * NO page reload on any action. Everything is React state + API.
 */

import { useState, useMemo, useEffect } from "react";
import { Skeleton, DataState } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useQuestionBank } from "../hooks/useQuestionBank";
import { showToast } from "@/utils/toast";
import type { QuestionFilters, QuestionType, Difficulty, QuestionStatus, CreateQuestionInput } from "../types/questionBank.types";

type TabView = "all" | "starred" | "archived";

interface ClassRow { _id: string; id?: string; name: string; }

export function QuestionBankPage({ defaultTab = "all" }: { defaultTab?: TabView }) {
  const [tab, setTab] = useState<TabView>(defaultTab);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [boardFilter, setBoardFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");

  const filters: QuestionFilters = {
    status: tab === "archived" ? "archived" : "active",
    search: search || undefined,
    board: boardFilter || undefined,
    class_id: classFilter || undefined,
    subject: subjectFilter || undefined,
    chapter: chapterFilter || undefined,
    type: typeFilter || undefined,
    difficulty: difficultyFilter || undefined,
  };

  const { state, starredIds, createQuestion, archiveQuestion, restoreQuestion, toggleStar } = useQuestionBank(filters);

  // Fetch classes for filter dropdown
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) return [];
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    });
  }, [runClasses]);

  const classes = classState.data || [];
  const questions = state.data || [];
  const isLoading = state.status === "loading" || state.status === "idle";

  // Filter starred on client side
  const displayQuestions = useMemo(() => {
    if (tab === "starred") {
      return questions.filter((q) => starredIds.has(q._id));
    }
    return questions;
  }, [questions, tab, starredIds]);

  // Derive unique values for filter dropdowns
  const boards = useMemo(() => [...new Set(questions.map((q) => q.board).filter(Boolean))], [questions]);
  const subjects = useMemo(() => [...new Set(questions.map((q) => q.subject).filter(Boolean))], [questions]);
  const chapters = useMemo(() => [...new Set(questions.map((q) => q.chapter).filter(Boolean))], [questions]);

  return (
    <div className="space-y-5 pb-12">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">library_books</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">Question Bank</p>
            <p className="text-[10px] font-bold text-slate-400">{displayQuestions.length} questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="h-8 w-[200px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400"
            />
          </div>

          {/* Tabs */}
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            {([
              { key: "all", label: "All", icon: "" },
              { key: "starred", label: "⭐ Starred", icon: "" },
              { key: "archived", label: "Archived", icon: "" },
            ] as { key: TabView; label: string; icon: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`h-7 px-3 rounded-md text-[11px] font-bold transition-colors ${
                  tab === t.key ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-violet-600 text-white text-[12px] font-bold shadow-sm hover:bg-violet-700 transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Question
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-2">
        <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Boards</option>
          {boards.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
        </select>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Chapters</option>
          {chapters.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="short">Short</option>
          <option value="long">Long</option>
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as any)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none">
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {(boardFilter || classFilter || subjectFilter || chapterFilter || typeFilter || difficultyFilter) && (
          <button
            onClick={() => { setBoardFilter(""); setClassFilter(""); setSubjectFilter(""); setChapterFilter(""); setTypeFilter(""); setDifficultyFilter(""); }}
            className="h-8 px-2 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && displayQuestions.length === 0 && (
        <DataState
          variant="empty"
          title={tab === "starred" ? "No starred questions" : tab === "archived" ? "No archived questions" : "No questions yet"}
          message={tab === "all" ? "Add your first question to the bank." : ""}
        />
      )}

      {/* Question Cards */}
      {!isLoading && displayQuestions.length > 0 && (
        <div className="space-y-3">
          {displayQuestions.map((q) => {
            const starred = starredIds.has(q._id);
            return (
              <div key={q._id} className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors group">
                <div className="flex items-start gap-3">
                  {/* Question content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm text-slate-800 font-medium leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: q.question_html }}
                    />
                    {/* MCQ options */}
                    {q.type === "mcq" && q.options && q.options.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {q.options.map((opt, i) => (
                          <p key={opt.id || i} className={`text-xs px-2 py-1 rounded ${opt.is_correct ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600"}`}>
                            ({String.fromCharCode(65 + i)}) {opt.option_text}
                          </p>
                        ))}
                      </div>
                    )}
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{q.type.toUpperCase()}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{q.difficulty}</span>
                      {q.subject && <span className="text-[9px] text-slate-500">{q.subject}</span>}
                      {q.chapter && <span className="text-[9px] text-slate-400">· {q.chapter}</span>}
                      {q.class_name && <span className="text-[9px] text-slate-400">· {q.class_name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleStar(q._id)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${starred ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
                      title={starred ? "Unstar" : "Star"}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: starred ? '"FILL" 1' : '"FILL" 0' }}>star</span>
                    </button>
                    {tab !== "archived" ? (
                      <button
                        onClick={() => archiveQuestion(q._id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Archive"
                      >
                        <span className="material-symbols-outlined text-lg">archive</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => restoreQuestion(q._id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Restore"
                      >
                        <span className="material-symbols-outlined text-lg">unarchive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Drawer */}
      <AddQuestionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={createQuestion}
        classes={classes}
      />
    </div>
  );
}

// ─── Add Question Drawer ─────────────────────────────────────────────────

function AddQuestionDrawer({
  isOpen,
  onClose,
  onSave,
  classes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateQuestionInput) => Promise<any>;
  classes: ClassRow[];
}) {
  const [type, setType] = useState<QuestionType>("short");
  const [board, setBoard] = useState("");
  const [classId, setClassId] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionHtml, setQuestionHtml] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState<number>(-1);
  const [saving, setSaving] = useState(false);

  function reset() {
    setQuestionHtml("");
    setOptions(["", "", "", ""]);
    setCorrectIdx(-1);
  }

  async function handleSave() {
    if (!questionHtml.trim()) {
      showToast("Please enter the question.", "error");
      return;
    }
    if (!classId) {
      showToast("Please select a class.", "error");
      return;
    }

    setSaving(true);
    try {
      const input: CreateQuestionInput = {
        board,
        class_id: classId,
        subject,
        chapter,
        type,
        difficulty,
        question_html: questionHtml.trim(),
        options: type === "mcq"
          ? options.filter((o) => o.trim()).map((o, i) => ({ option_text: o.trim(), is_correct: i === correctIdx }))
          : undefined,
      };
      await onSave(input);
      reset();
      // Don't close — teacher might add more
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="max-w-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Add Question</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Question Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["mcq", "short", "long"] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`h-9 rounded-lg text-[11px] font-bold uppercase border transition-all ${type === t ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"}`}
                >
                  {t === "mcq" ? "MCQ" : t === "short" ? "Short" : "Long"}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Board</label>
              <input type="text" value={board} onChange={(e) => setBoard(e.target.value)} placeholder="e.g. Punjab Board" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-500 outline-none placeholder:text-slate-300" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Class *</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-violet-500 outline-none">
                <option value="">Select</option>
                {classes.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-500 outline-none placeholder:text-slate-300" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Chapter</label>
              <input type="text" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Cell Biology" className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-500 outline-none placeholder:text-slate-300" />
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`h-8 rounded-lg text-[10px] font-bold capitalize border transition-all ${difficulty === d ? (d === "easy" ? "bg-emerald-600 text-white border-emerald-600" : d === "hard" ? "bg-red-600 text-white border-red-600" : "bg-amber-600 text-white border-amber-600") : "bg-white text-slate-600 border-slate-200"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question Text — contentEditable for rich text */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Question *</label>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setQuestionHtml((e.target as HTMLDivElement).innerHTML)}
              className="w-full min-h-[100px] rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none [&:empty]:before:content-['Type_your_question_here...'] [&:empty]:before:text-slate-300"
              dir="auto"
            />
            <p className="text-[9px] text-slate-400">Supports Urdu, bold (Ctrl+B), images (paste), rich formatting.</p>
          </div>

          {/* MCQ Options */}
          {type === "mcq" && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Options (select correct one)</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectIdx(i)}
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${correctIdx === i ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-300 hover:border-emerald-400"}`}
                  >
                    {correctIdx === i && <span className="material-symbols-outlined text-sm">check</span>}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => { const c = [...options]; c[i] = e.target.value; setOptions(c); }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-500 outline-none placeholder:text-slate-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving || !questionHtml.trim() || !classId}
            className="w-full h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
          >
            {saving ? "Saving..." : "Save Question"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
