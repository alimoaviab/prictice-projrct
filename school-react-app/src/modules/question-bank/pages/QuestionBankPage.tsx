import { AppIcon } from "shared/ui/AppIcon";
/**
 * Question Bank — Enterprise main page.
 *
 * Flow: Class → Subject → Multi-Chapter → Type/Difficulty/Marks/Search.
 * Live stats cards, bulk select, cascading filters, instant client-side search.
 *
 * NO page reload. All actions are React-state + API.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton, DataState } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useQuestionBank } from "../hooks/useQuestionBank";
import * as service from "../services/questionBank.service";
import { showToast } from "@/utils/toast";
import { getQuestionTypeLabel, QUESTION_TYPES } from "@/data/question-types";
import type {
  QuestionFilters,
  QuestionType,
  Difficulty,
  CreateQuestionInput,
  BankQuestion,
  QuestionStats,
  QuestionOption,
} from "../types/questionBank.types";

type TabView = "all" | "starred" | "archived";

interface ClassRow { _id: string; id?: string; name: string; }
interface SubjectRow { _id: string; id?: string; name: string; }
interface ChapterRow { _id: string; id?: string; title: string; class_id?: string; subject_id?: string; }

export function QuestionBankPage({ defaultTab = "all" }: { defaultTab?: TabView }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rolePrefix = location.pathname.startsWith("/teacher") ? "/teacher" : "/admin";
  const [tab, setTab] = useState<TabView>(defaultTab);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Cascading filters
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [chapterFilter, setChapterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");
  const [marksFilter, setMarksFilter] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filters: QuestionFilters = {
    status: tab === "archived" ? "archived" : "active",
    search: search || undefined,
    class_id: classFilter || undefined,
    subject_id: subjectFilter || undefined,
    chapter_id: chapterFilter || undefined,
    type: typeFilter || undefined,
    difficulty: difficultyFilter || undefined,
  };

  const { state, starredIds, createQuestion, archiveQuestion, restoreQuestion, toggleStar, refresh } = useQuestionBank(filters);

  // Stats — refresh whenever filters that affect counts change
  const { state: statsState, run: runStats } = useSafeAsync<QuestionStats>();
  const loadStats = useCallback(() => {
    return runStats(async () => {
      const r = await service.getStats({
        class_id: classFilter || undefined,
        subject_id: subjectFilter || undefined,
        chapter_id: chapterFilter || undefined,
      });
      if (!r.ok) return { total: 0, mcq: 0, short: 0, long: 0, easy: 0, medium: 0, hard: 0 };
      return r.data ?? { total: 0, mcq: 0, short: 0, long: 0, easy: 0, medium: 0, hard: 0 };
    });
  }, [runStats, classFilter, subjectFilter, chapterFilter]);
  useEffect(() => { void loadStats().catch(() => {}); }, [loadStats, state.data]);

  // Classes (always)
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runClasses]);

  // Subjects — load once, filter client side by class if needed.
  // The /api/classes/{id}/subjects endpoint returns class-scoped
  // ClassSubject docs ({ name, total_marks, ... }) wrapped in
  // { subjects: [...] } and without _id. We normalize both shapes
  // here and fall back to /api/subjects when the class has none.
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  useEffect(() => {
    void runSubjects(async () => {
      const normalize = (raw: any): SubjectRow[] => {
        if (!raw) return [];
        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (Array.isArray(raw?.subjects)) arr = raw.subjects;
        else if (Array.isArray(raw?.data)) arr = raw.data;
        else if (Array.isArray(raw?.items)) arr = raw.items;
        return arr
          .map((s: any) => ({
            _id: s?._id || s?.id || s?.subject_id || s?.name || "",
            id: s?.id,
            name: s?.name || s?.subject_name || "",
          }))
          .filter((s) => s.name);
      };

      // Prefer class-scoped subjects when a class is picked
      if (classFilter) {
        const r = await serviceRequest<any>(`/api/classes/${classFilter}/subjects`);
        if (r.ok) {
          const list = normalize(r.data);
          if (list.length > 0) return list;
        }
      }
      // Fallback to school-wide subjects
      const r = await serviceRequest<any>("/api/subjects");
      if (!r.ok) return [];
      return normalize(r.data);
    });
  }, [runSubjects, classFilter]);

  // Chapters — depend on class + subject. Also auto-seeds Pakistani
  // curriculum defaults the first time a (class, subject) combo is opened
  // so teachers see something instead of an empty dropdown.
  const { state: chapterState, run: runChapters } = useSafeAsync<ChapterRow[]>();
  const reloadChapters = useCallback(async () => {
    if (!classFilter) return;
    await runChapters(async () => {
      const params = new URLSearchParams({ class_id: classFilter });
      if (subjectFilter) params.set("subject_id", subjectFilter);
      const r = await serviceRequest<any>(`/api/chapters?${params.toString()}`);
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runChapters, classFilter, subjectFilter]);

  useEffect(() => {
    if (!classFilter) return;
    void (async () => {
      // Best-effort seed — backend is idempotent, returns count=0 if already
      // seeded or if the subject has no defaults defined.
      if (classFilter && subjectFilter) {
        await serviceRequest<any>("/api/chapters/seed-defaults", {
          method: "POST",
          body: JSON.stringify({ class_id: classFilter, subject_id: subjectFilter }),
        });
      }
      await reloadChapters();
    })();
  }, [classFilter, subjectFilter, reloadChapters]);

  // Inline "Add Chapter" state
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);

  async function addChapterInline() {
    const title = newChapterTitle.trim();
    if (!title || !classFilter) return;
    setAddingChapter(true);
    try {
      const r = await serviceRequest<any>("/api/chapters", {
        method: "POST",
        body: JSON.stringify({
          class_id: classFilter,
          subject_id: subjectFilter || undefined,
          title,
        }),
      });
      if (!r.ok) {
        showToast(r.error?.message || "Failed to add chapter.", "error");
        return;
      }
      const created = r.data;
      const id = created?._id || created?.id;
      showToast("Chapter added.", "success");
      setNewChapterTitle("");
      await reloadChapters();
      if (id) setChapterFilter(id);
    } finally {
      setAddingChapter(false);
    }
  }

  const classes = classState.data || [];
  const subjects = subjectState.data || [];
  const chapters = chapterState.data || [];
  const stats = statsState.data;
  const questions = state.data || [];
  const isLoading = state.status === "loading" || state.status === "idle";

  // Filter starred + marks on client side
  const displayQuestions = useMemo(() => {
    let qs = questions;
    if (tab === "starred") qs = qs.filter((q) => starredIds.has(q._id));
    if (marksFilter) qs = qs.filter((q) => String(q.marks || 0) === marksFilter);
    return qs;
  }, [questions, tab, starredIds, marksFilter]);

  const allSelected = displayQuestions.length > 0 && displayQuestions.every((q) => selectedIds.has(q._id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayQuestions.map((q) => q._id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkArchive() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const r = await service.bulkArchive(ids);
    if (r.ok) {
      showToast(`${r.data?.archived ?? ids.length} questions archived.`, "success");
      setSelectedIds(new Set());
      await refresh();
    } else {
      showToast("Bulk archive failed.", "error");
    }
  }

  async function bulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} question(s)? This cannot be undone.`)) return;
    const r = await service.bulkDelete(ids);
    if (r.ok) {
      showToast(`${r.data?.deleted ?? ids.length} questions deleted.`, "success");
      setSelectedIds(new Set());
      await refresh();
    } else {
      showToast("Bulk delete failed.", "error");
    }
  }

  function clearAll() {
    setClassFilter("");
    setSubjectFilter("");
    setChapterFilter("");
    setTypeFilter("");
    setDifficultyFilter("");
    setMarksFilter("");
    setSearch("");
  }

  const hasFilters = !!(classFilter || subjectFilter || chapterFilter || typeFilter || difficultyFilter || marksFilter || search);

  return (
    <div className="space-y-5 pb-12">
      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0 shadow-sm">
            <AppIcon name="Library" size={18} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">Question Bank</p>
            <p className="text-[10px] font-bold text-slate-400">{displayQuestions.length} of {stats?.total ?? 0} questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <AppIcon name="Search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, tags…"
              className="h-8 w-[220px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400"
            />
          </div>

          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            {(
              [
                { key: "all", label: "All" },
                { key: "starred", label: "Starred" },
                { key: "archived", label: "Archived" },
              ] as { key: TabView; label: string }[]
            ).map((t) => (
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

          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-violet-600 text-white text-[12px] font-bold shadow-sm hover:bg-violet-700 transition-colors active:scale-[0.98]"
          >
            <AppIcon name="Plus" size={16} />
            Add Question
          </button>
        </div>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats?.total ?? 0} accent="violet" icon="quiz" />
        <StatCard label="MCQs" value={stats?.mcq ?? 0} accent="indigo" icon="check_box" />
        <StatCard label="Short" value={stats?.short ?? 0} accent="amber" icon="short_text" />
        <StatCard label="Long" value={stats?.long ?? 0} accent="emerald" icon="notes" />
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2 items-center">
          <FilterSelect value={classFilter} onChange={(v) => { setClassFilter(v); setSubjectFilter(""); setChapterFilter(""); }} options={[{ value: "", label: "All Classes" }, ...classes.map((c) => ({ value: c._id || c.id || "", label: c.name }))]} />
          <FilterSelect value={subjectFilter} onChange={(v) => { setSubjectFilter(v); setChapterFilter(""); }} options={[{ value: "", label: "All Subjects" }, ...subjects.map((s) => ({ value: s._id || s.id || "", label: s.name }))]} disabled={!classFilter} />
          <FilterSelect value={chapterFilter} onChange={setChapterFilter} options={[{ value: "", label: "All Chapters" }, ...chapters.map((c) => ({ value: c._id || c.id || "", label: c.title }))]} disabled={!subjectFilter} />
          <FilterSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as any)}
            options={[{ value: "", label: "All Types" }, ...QUESTION_TYPES.map((type) => ({ value: type.id, label: type.label }))]}
          />
          <FilterSelect value={difficultyFilter} onChange={(v) => setDifficultyFilter(v as any)} options={[
            { value: "", label: "All Difficulty" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]} />
          <FilterSelect value={marksFilter} onChange={setMarksFilter} options={[
            { value: "", label: "All Marks" },
            { value: "1", label: "1 mark" },
            { value: "2", label: "2 marks" },
            { value: "3", label: "3 marks" },
            { value: "5", label: "5 marks" },
            { value: "8", label: "8 marks" },
            { value: "10", label: "10 marks" },
          ]} />
          {hasFilters && (
            <button
              onClick={clearAll}
              className="h-8 px-2 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Inline Add-Chapter row — visible once a class is picked */}
        {classFilter && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <AppIcon name="BookOpen" size={16} className="text-slate-400" />
            <input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addChapterInline(); }}
              placeholder={subjectFilter ? "+ Add new chapter for this subject" : "+ Add new chapter (subject optional)"}
              className="flex-1 h-8 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 placeholder:text-slate-400"
            />
            <button
              onClick={addChapterInline}
              disabled={addingChapter || !newChapterTitle.trim()}
              className="h-8 px-3 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {addingChapter ? "Adding…" : "Add Chapter"}
            </button>
            <span className="text-[10px] text-slate-400 hidden sm:inline">{chapters.length} existing</span>
          </div>
        )}
      </div>

      {/* ─── Bulk Action Bar ─────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
          <p className="text-[12px] font-bold text-violet-700">
            {selectedIds.size} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Store selected questions with class/subject context
                const selectedQuestions = displayQuestions.filter((q) => selectedIds.has(q._id)).map((q) => ({
                  ...q,
                  // Ensure class_id and subject_id from filters are passed
                  class_id: q.class_id || classFilter,
                  subject_id: q.subject_id || subjectFilter,
                }));
                sessionStorage.setItem("paper_selected_questions", JSON.stringify(selectedQuestions));
                navigate(`${rolePrefix}/question-papers/create`);
              }}
              className="h-7 px-3 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1"
            >
              <AppIcon name="FileText" size={14} />
              Create Paper
            </button>
            {tab !== "archived" && (
              <button onClick={bulkArchive} className="h-7 px-3 rounded-lg bg-white border border-violet-200 text-[11px] font-bold text-violet-700 hover:bg-violet-100">
                Archive selected
              </button>
            )}
            <button onClick={bulkDelete} className="h-7 px-3 rounded-lg bg-white border border-red-200 text-[11px] font-bold text-red-600 hover:bg-red-50">
              Delete
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="h-7 px-3 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-900">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ─── List ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      )}

      {!isLoading && displayQuestions.length === 0 && (
        <DataState
          variant="empty"
          title={tab === "starred" ? "No starred questions" : tab === "archived" ? "No archived questions" : "No questions yet"}
          message={tab === "all" ? "Add your first question to the bank." : ""}
        />
      )}

      {!isLoading && displayQuestions.length > 0 && (
        <>
          {/* Select-all row */}
          <div className="flex items-center gap-2 px-1">
            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Select all on this page
            </label>
          </div>

          <div className="space-y-3">
            {displayQuestions.map((q) => (
              <QuestionCard
                key={q._id}
                question={q}
                starred={starredIds.has(q._id)}
                selected={selectedIds.has(q._id)}
                tab={tab}
                onSelect={() => toggleSelect(q._id)}
                onStar={() => toggleStar(q._id)}
                onArchive={() => archiveQuestion(q._id)}
                onRestore={() => restoreQuestion(q._id)}
              />
            ))}
          </div>
        </>
      )}

      <AddQuestionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={createQuestion}
        classes={classes}
        defaultClassId={classFilter}
        defaultSubjectId={subjectFilter}
        defaultChapterId={chapterFilter}
      />
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────

function StatCard({ label, value, accent, icon }: { label: string; value: number; accent: "violet" | "indigo" | "amber" | "emerald"; icon: string }) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  } as const;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 ring-1 ring-slate-900/5 shadow-sm flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tones[accent]}`}>
        <AppIcon name={icon} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-extrabold text-slate-900 tracking-tight tabular-nums">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-medium bg-white focus:border-violet-500 outline-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function QuestionCard({
  question: q,
  starred,
  selected,
  tab,
  onSelect,
  onStar,
  onArchive,
  onRestore,
}: {
  question: BankQuestion;
  starred: boolean;
  selected: boolean;
  tab: TabView;
  onSelect: () => void;
  onStar: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const opts = useMemo<QuestionOption[]>(() => {
    if (!q.options) return [];
    if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return q.options;
  }, [q.options]);

  return (
    <div className={`bg-white rounded-xl border p-4 transition-colors group ${selected ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        />

        <div className="flex-1 min-w-0">
          <div
            className="text-sm text-slate-800 font-medium leading-relaxed line-clamp-3"
            dangerouslySetInnerHTML={{ __html: q.question_html }}
          />
          {q.type === "mcq" && opts.length > 0 && (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {opts.map((opt, i) => (
                <p key={i} className={`text-xs px-2 py-1 rounded ${opt.is_correct ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-600"}`}>
                  ({String.fromCharCode(65 + i)}) {opt.option_text}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{getQuestionTypeLabel(q.type)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
              {q.difficulty}
            </span>
            {q.marks ? <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{q.marks} mark{q.marks > 1 ? "s" : ""}</span> : null}
            {q.subject_name && <span className="text-[9px] text-slate-500">{q.subject_name}</span>}
            {q.chapter_name && <span className="text-[9px] text-slate-400">· {q.chapter_name}</span>}
            {q.class_name && <span className="text-[9px] text-slate-400">· {q.class_name}</span>}
            {q.created_by_name && <span className="text-[9px] text-slate-400 ml-auto">by {q.created_by_name}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onStar}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${starred ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-amber-50"}`}
            title={starred ? "Unstar" : "Star"}
          >
            <AppIcon name="Star" size={18} style={{ fontVariationSettings: starred ? '"FILL" 1' : '"FILL" 0' }} />
          </button>
          {tab !== "archived" ? (
            <button
              onClick={onArchive}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Archive"
            >
              <AppIcon name="Archive" size={18} />
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Restore"
            >
              <AppIcon name="Unarchive" size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Question Drawer ─────────────────────────────────────────────────

function AddQuestionDrawer({
  isOpen,
  onClose,
  onSave,
  classes,
  defaultClassId,
  defaultSubjectId,
  defaultChapterId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: CreateQuestionInput) => Promise<any>;
  classes: ClassRow[];
  defaultClassId?: string;
  defaultSubjectId?: string;
  defaultChapterId?: string;
}) {
  const [type, setType] = useState<QuestionType>(
    QUESTION_TYPES.find((item) => item.id === "question_answers")?.id || QUESTION_TYPES[0]?.id || "mcq",
  );
  const [classId, setClassId] = useState(defaultClassId || "");
  const [subjectId, setSubjectId] = useState(defaultSubjectId || "");
  const [chapterId, setChapterId] = useState(defaultChapterId || "");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [marks, setMarks] = useState<number>(5);
  const [questionHtml, setQuestionHtml] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState<number>(-1);
  const [saving, setSaving] = useState(false);

  // Sync defaults
  useEffect(() => { if (defaultClassId) setClassId(defaultClassId); }, [defaultClassId]);
  useEffect(() => { if (defaultSubjectId) setSubjectId(defaultSubjectId); }, [defaultSubjectId]);
  useEffect(() => { if (defaultChapterId) setChapterId(defaultChapterId); }, [defaultChapterId]);

  // Cascading class/subject/chapter lookups
  // Mirror the page-level normalizer so the drawer dropdown is consistent.
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  useEffect(() => {
    if (!classId) return;
    void runSubjects(async () => {
      const normalize = (raw: any): SubjectRow[] => {
        if (!raw) return [];
        let arr: any[] = [];
        if (Array.isArray(raw)) arr = raw;
        else if (Array.isArray(raw?.subjects)) arr = raw.subjects;
        else if (Array.isArray(raw?.data)) arr = raw.data;
        else if (Array.isArray(raw?.items)) arr = raw.items;
        return arr
          .map((s: any) => ({
            _id: s?._id || s?.id || s?.subject_id || s?.name || "",
            id: s?.id,
            name: s?.name || s?.subject_name || "",
          }))
          .filter((s) => s.name);
      };
      const r = await serviceRequest<any>(`/api/classes/${classId}/subjects`);
      if (r.ok) {
        const list = normalize(r.data);
        if (list.length > 0) return list;
      }
      // Fallback to school-wide subjects
      const r2 = await serviceRequest<any>("/api/subjects");
      if (!r2.ok) return [];
      return normalize(r2.data);
    });
  }, [runSubjects, classId]);

  const { state: chapterState, run: runChapters } = useSafeAsync<ChapterRow[]>();
  useEffect(() => {
    if (!classId || !subjectId) return;
    void runChapters(async () => {
      const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runChapters, classId, subjectId]);

  const subjects = subjectState.data || [];
  const chapters = chapterState.data || [];

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
    if (type === "mcq" && correctIdx < 0) {
      showToast("Please mark the correct option.", "error");
      return;
    }

    setSaving(true);
    try {
      const input: CreateQuestionInput = {
        class_id: classId,
        subject_id: subjectId || undefined,
        chapter_id: chapterId || undefined,
        type,
        difficulty,
        marks: marks || undefined,
        question_html: questionHtml.trim(),
        options:
          type === "mcq"
            ? options.filter((o) => o.trim()).map((o, i) => ({ option_text: o.trim(), is_correct: i === correctIdx }))
            : undefined,
      };
      // Backend expects options as JSON-encoded string for /api/questions; the
      // /api/question-bank endpoint also accepts a structured array — we use the
      // structured payload because the service hits /api/question-bank.
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
            <AppIcon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">Question Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUESTION_TYPES.map((questionType) => (
                <button
                  key={questionType.id}
                  type="button"
                  onClick={() => setType(questionType.id)}
                  className={`min-h-9 rounded-lg px-2 py-1.5 text-[11px] font-bold border transition-all ${
                    type === questionType.id ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                  }`}
                >
                  {questionType.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Class *</label>
              <select value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectId(""); setChapterId(""); }} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-violet-500 outline-none">
                <option value="">Select</option>
                {classes.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Subject</label>
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setChapterId(""); }} disabled={!classId} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-violet-500 outline-none disabled:opacity-50">
                <option value="">Select</option>
                {subjects.map((s) => <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Chapter</label>
              <select value={chapterId} onChange={(e) => setChapterId(e.target.value)} disabled={!subjectId} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-violet-500 outline-none disabled:opacity-50">
                <option value="">Select</option>
                {chapters.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>)}
              </select>
              {subjectId && (
                <DrawerInlineAddChapter
                  classId={classId}
                  subjectId={subjectId}
                  onAdded={async (newId) => {
                    await runChapters(async () => {
                      const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
                      if (!r.ok) return [];
                      const raw = r.data;
                      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
                    });
                    if (newId) setChapterId(newId);
                  }}
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Marks</label>
              <input type="number" min={0} value={marks} onChange={(e) => setMarks(parseInt(e.target.value || "0", 10))} className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-violet-500 outline-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`h-8 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                    difficulty === d
                      ? d === "easy"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : d === "hard"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

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

          {type === "mcq" && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500">Options (mark the correct one)</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectIdx(i)}
                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${correctIdx === i ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-300 hover:border-emerald-400"}`}
                  >
                    {correctIdx === i && <AppIcon name="Check" size={14} />}
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


// Inline "+ New Chapter" widget shown under the Chapter <select> in the
// Add Question drawer. Lets the teacher add a chapter without leaving
// the form.
function DrawerInlineAddChapter({
  classId,
  subjectId,
  onAdded,
}: {
  classId: string;
  subjectId: string;
  onAdded: (newId?: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    try {
      const r = await serviceRequest<any>("/api/chapters", {
        method: "POST",
        body: JSON.stringify({ class_id: classId, subject_id: subjectId, title: t }),
      });
      if (!r.ok) {
        showToast(r.error?.message || "Failed to add chapter.", "error");
        return;
      }
      const id = r.data?._id || r.data?.id;
      showToast("Chapter added.", "success");
      setTitle("");
      setOpen(false);
      await onAdded(id);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-bold text-violet-600 hover:underline mt-0.5"
      >
        + Add new chapter
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }}
        placeholder="New chapter title"
        className="flex-1 h-8 rounded-lg border border-slate-200 px-2 text-xs focus:border-violet-500 outline-none placeholder:text-slate-300"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy || !title.trim()}
        className="h-8 px-2.5 rounded-lg bg-violet-600 text-white text-[10px] font-bold hover:bg-violet-700 disabled:opacity-50"
      >
        {busy ? "…" : "Add"}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setTitle(""); }}
        className="h-8 px-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-700"
      >
        Cancel
      </button>
    </div>
  );
}
