import DOMPurify from "dompurify";
import { AppIcon } from "shared/ui/AppIcon";
/**
 * Question Paper Generator — Enterprise-grade module.
 *
 * Flow: Class → Subject → Multi-Chapter → Load Questions → Select → Generate Paper
 *
 * Features:
 * - Cascading filters (class/subject/chapter/type/difficulty/marks)
 * - Real-time search
 * - Checkbox-based question selection from Question Bank
 * - Live marks calculation & question count breakdown
 * - Sticky bottom action bar
 * - Paper settings modal (exam name, time, instructions)
 * - Auto-sectioned preview (Section A: MCQ, B: Short, C: Long)
 * - Print / Export PDF / Save
 * - NO page reloads — all optimistic React state + API
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Skeleton, DataState } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { useQuestionPapers } from "../hooks/useQuestionPapers";
import { showToast } from "@/utils/toast";
import type { PaperQuestion, QuestionType, Difficulty } from "../types/questionPaper.types";

// ─── Types ───────────────────────────────────────────────────────────────

interface ClassRow { _id: string; id?: string; name: string }
interface SubjectRow { _id: string; id?: string; name: string }
interface ChapterRow { _id: string; id?: string; title: string; subject_id?: string; class_id?: string }
interface TeacherRow { _id: string; id?: string; first_name: string; last_name: string }
interface QuestionRow {
  _id: string; id?: string
  question_html: string; type: string; difficulty: string
  subject_id?: string; subject_name?: string
  chapter_id?: string; chapter_name?: string
  class_id?: string; class_name?: string
  options?: any; marks?: number
  is_global?: boolean; created_by_name?: string
}

type Step = "select" | "settings" | "preview";

// ─── Main Component ──────────────────────────────────────────────────────

export function QuestionPaperGeneratorPage() {
  const navigate = useNavigate();
  const { create } = useQuestionPapers();
  const { schoolName } = useSchoolBranding();
  const [step, setStep] = useState<Step>("select");

  // ─── Filters ─────────────────────────────────────────────────────────
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [marksFilter, setMarksFilter] = useState("");
  const [search, setSearch] = useState("");

  // ─── Selection ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Paper Settings ──────────────────────────────────────────────────
  const [examName, setExamName] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [totalTime, setTotalTime] = useState("3 Hours");
  const [passingMarks, setPassingMarks] = useState(33);
  const [instructions, setInstructions] = useState("Attempt all questions.\nWrite neatly and clearly.\nMarks are mentioned against each question.");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");

  const [saving, setSaving] = useState(false);

  // ─── Data Loading ────────────────────────────────────────────────────

  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  const { state: chapterState, run: runChapters } = useSafeAsync<ChapterRow[]>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<TeacherRow[]>();
  const { state: questionState, run: runQuestions } = useSafeAsync<QuestionRow[]>();
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();

  // Load classes + teachers + settings on mount
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
    void runTeachers(async () => {
      const r = await serviceRequest<any>("/api/teachers");
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
    void runSettings(async () => {
      const r = await serviceRequest<any>("/api/settings");
      return r.ok ? r.data : null;
    }).catch(() => {});
  }, [runClasses, runTeachers, runSettings]);

  // Load subjects when class changes
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
        return arr.map((s: any) => ({ _id: s?._id || s?.id || s?.name || "", name: s?.name || "" })).filter(s => s.name);
      };
      const r = await serviceRequest<any>(`/api/classes/${classId}/subjects`);
      if (r.ok) { const list = normalize(r.data); if (list.length > 0) return list; }
      const r2 = await serviceRequest<any>("/api/subjects");
      return r2.ok ? normalize(r2.data) : [];
    });
  }, [runSubjects, classId]);

  // Load chapters when class+subject changes
  useEffect(() => {
    if (!classId || !subjectId) return;
    void runChapters(async () => {
      // Seed defaults first
      await serviceRequest<any>("/api/chapters/seed-defaults", { method: "POST", body: JSON.stringify({ class_id: classId, subject_id: subjectId }) });
      const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runChapters, classId, subjectId]);

  // Load questions when filters change
  useEffect(() => {
    if (!classId) return;
    void runQuestions(async () => {
      const params = new URLSearchParams({ class_id: classId });
      if (subjectId) params.set("subject_id", subjectId);
      if (selectedChapterIds.length === 1) params.set("chapter_id", selectedChapterIds[0]);
      const r = await serviceRequest<any>(`/api/questions?${params}`);
      if (!r.ok) return [];
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
    });
  }, [runQuestions, classId, subjectId, selectedChapterIds]);

  // ─── Derived Data ────────────────────────────────────────────────────

  const classes = classState.data || [];
  const subjects = subjectState.data || [];
  const chapters = chapterState.data || [];
  const teachers = teacherState.data || [];
  const allQuestions = questionState.data || [];
  const resolvedSchoolName = settingsState.data?.profile?.school_name || schoolName || "School Name";
  const isLoading = questionState.status === "loading";

  const selectedClass = classes.find(c => (c._id || c.id) === classId);
  const selectedSubject = subjects.find(s => (s._id || s.id) === subjectId);
  const selectedTeacher = teachers.find(t => (t._id || t.id) === teacherId);

  // Client-side filtering
  const filteredQuestions = useMemo(() => {
    let qs = allQuestions;
    if (selectedChapterIds.length > 1) {
      qs = qs.filter(q => selectedChapterIds.includes(q.chapter_id || ""));
    }
    if (typeFilter) qs = qs.filter(q => q.type === typeFilter);
    if (difficultyFilter) qs = qs.filter(q => q.difficulty === difficultyFilter);
    if (marksFilter) qs = qs.filter(q => String(q.marks || 0) === marksFilter);
    if (search) {
      const s = search.toLowerCase();
      qs = qs.filter(q => q.question_html.toLowerCase().includes(s));
    }
    return qs;
  }, [allQuestions, selectedChapterIds, typeFilter, difficultyFilter, marksFilter, search]);

  // Selected questions data
  const selectedQuestions = useMemo(() => allQuestions.filter(q => selectedIds.has(q._id)), [allQuestions, selectedIds]);
  const totalMarks = useMemo(() => selectedQuestions.reduce((s, q) => s + (q.marks || 0), 0), [selectedQuestions]);
  const mcqCount = useMemo(() => selectedQuestions.filter(q => q.type === "mcq").length, [selectedQuestions]);
  const shortCount = useMemo(() => selectedQuestions.filter(q => q.type === "short").length, [selectedQuestions]);
  const longCount = useMemo(() => selectedQuestions.filter(q => q.type === "long").length, [selectedQuestions]);

  // ─── Actions ─────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredQuestions.map(q => q._id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function toggleChapter(id: string) {
    setSelectedChapterIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSave() {
    if (!paperTitle.trim() && !examName.trim()) {
      showToast("Please enter a paper title or exam name.", "error");
      return;
    }
    setSaving(true);
    try {
      const paperQuestions: PaperQuestion[] = selectedQuestions.map((q, i) => {
        let opts: string[] | undefined;
        let correct: string | undefined;
        if (q.type === "mcq" && q.options) {
          try {
            const parsed = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            if (Array.isArray(parsed)) {
              opts = parsed.map((o: any) => o.option_text);
              const c = parsed.find((o: any) => o.is_correct);
              correct = c?.option_text;
            }
          } catch {/* */}
        }
        return {
          id: q._id,
          type: q.type as QuestionType,
          question: q.question_html,
          marks: q.marks || 0,
          difficulty: q.difficulty as Difficulty,
          options: opts,
          correct_answer: correct,
          sort_order: i + 1,
        };
      });

      const result = await create({
        title: paperTitle || examName,
        class_id: classId,
        subject_id: subjectId || undefined,
        chapter_ids: selectedChapterIds.length > 0 ? selectedChapterIds : undefined,
        teacher_id: teacherId || undefined,
        date: date || undefined,
        questions: paperQuestions,
      });
      if (result && (result as any).ok !== false) {
        navigate("/admin/question-papers");
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    printPaper({
      schoolName: resolvedSchoolName,
      examName,
      paperTitle,
      className: selectedClass?.name || "",
      subjectName: selectedSubject?.name || "",
      teacherName: selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "",
      date,
      totalTime,
      passingMarks,
      instructions,
      questions: selectedQuestions,
      totalMarks,
    });
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/question-papers" className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Question Paper Generator</h1>
            <p className="text-[11px] text-slate-400 font-medium">Select questions from bank → Configure → Generate professional paper</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step === "select" && selectedIds.size > 0 && (
            <button onClick={() => setStep("settings")} className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5">
              <AppIcon name="Sliders" size={14} />
              Configure Paper ({selectedIds.size})
            </button>
          )}
          {step === "settings" && (
            <button onClick={() => setStep("preview")} className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5">
              <AppIcon name="Eye" size={14} />
              Preview Paper
            </button>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("settings")} className="h-9 px-4 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors">
                ← Edit Settings
              </button>
              <button onClick={handlePrint} className="h-9 px-4 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors inline-flex items-center gap-1.5">
                <AppIcon name="Printer" size={14} />
                Print / PDF
              </button>
              <button onClick={handleSave} disabled={saving} className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5">
                <AppIcon name="Save" size={14} />
                {saving ? "Saving..." : "Save Paper"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {(["select", "settings", "preview"] as Step[]).map((s, i) => (
          <button key={s} onClick={() => { if (s === "select" || (s === "settings" && selectedIds.size > 0) || (s === "preview" && selectedIds.size > 0)) setStep(s); }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${step === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">{i + 1}</span>
            {s === "select" ? "Select Questions" : s === "settings" ? "Paper Settings" : "Preview & Save"}
          </button>
        ))}
      </div>

      {/* Step Content */}
      {step === "select" && (
        <SelectQuestionsStep
          classes={classes}
          subjects={subjects}
          chapters={chapters}
          questions={filteredQuestions}
          selectedIds={selectedIds}
          isLoading={isLoading}
          classId={classId}
          subjectId={subjectId}
          selectedChapterIds={selectedChapterIds}
          typeFilter={typeFilter}
          difficultyFilter={difficultyFilter}
          marksFilter={marksFilter}
          search={search}
          onClassChange={v => { setClassId(v); setSubjectId(""); setSelectedChapterIds([]); setSelectedIds(new Set()); }}
          onSubjectChange={v => { setSubjectId(v); setSelectedChapterIds([]); }}
          onToggleChapter={toggleChapter}
          onTypeChange={setTypeFilter}
          onDifficultyChange={setDifficultyFilter}
          onMarksChange={setMarksFilter}
          onSearchChange={setSearch}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
        />
      )}

      {step === "settings" && (
        <PaperSettingsStep
          examName={examName} setExamName={setExamName}
          paperTitle={paperTitle} setPaperTitle={setPaperTitle}
          totalTime={totalTime} setTotalTime={setTotalTime}
          passingMarks={passingMarks} setPassingMarks={setPassingMarks}
          instructions={instructions} setInstructions={setInstructions}
          teacherId={teacherId} setTeacherId={setTeacherId}
          date={date} setDate={setDate}
          teachers={teachers}
          selectedCount={selectedIds.size}
          totalMarks={totalMarks}
          mcqCount={mcqCount}
          shortCount={shortCount}
          longCount={longCount}
        />
      )}

      {step === "preview" && (
        <PaperPreviewStep
          schoolName={resolvedSchoolName}
          examName={examName}
          paperTitle={paperTitle}
          className={selectedClass?.name || ""}
          subjectName={selectedSubject?.name || ""}
          teacherName={selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : ""}
          date={date}
          totalTime={totalTime}
          passingMarks={passingMarks}
          instructions={instructions}
          questions={selectedQuestions}
          totalMarks={totalMarks}
        />
      )}

      {/* Sticky Bottom Bar — visible during selection step */}
      {step === "select" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{selectedIds.size}</span>
                <span className="text-xs font-bold text-slate-600">Selected</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="text-emerald-600">{totalMarks} Marks</span>
                <span className="text-indigo-500">{mcqCount} MCQ</span>
                <span className="text-amber-500">{shortCount} Short</span>
                <span className="text-violet-500">{longCount} Long</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <button onClick={clearSelection} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                    Clear
                  </button>
                  <button onClick={() => setStep("preview")} className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1">
                    <AppIcon name="Eye" size={14} />
                    Preview
                  </button>
                  <button onClick={() => setStep("settings")} className="h-8 px-4 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5">
                    <AppIcon name="FileText" size={14} />
                    Generate Paper
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Select Questions
// ═══════════════════════════════════════════════════════════════════════════

function SelectQuestionsStep({
  classes, subjects, chapters, questions, selectedIds, isLoading,
  classId, subjectId, selectedChapterIds, typeFilter, difficultyFilter, marksFilter, search,
  onClassChange, onSubjectChange, onToggleChapter, onTypeChange, onDifficultyChange,
  onMarksChange, onSearchChange, onToggleSelect, onSelectAll, onClearSelection,
}: {
  classes: ClassRow[]; subjects: SubjectRow[]; chapters: ChapterRow[]
  questions: QuestionRow[]; selectedIds: Set<string>; isLoading: boolean
  classId: string; subjectId: string; selectedChapterIds: string[]
  typeFilter: string; difficultyFilter: string; marksFilter: string; search: string
  onClassChange: (v: string) => void; onSubjectChange: (v: string) => void
  onToggleChapter: (id: string) => void
  onTypeChange: (v: string) => void; onDifficultyChange: (v: string) => void
  onMarksChange: (v: string) => void; onSearchChange: (v: string) => void
  onToggleSelect: (id: string) => void; onSelectAll: () => void; onClearSelection: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={classId} onChange={onClassChange} options={[{ value: "", label: "Select Class *" }, ...classes.map(c => ({ value: c._id || c.id || "", label: c.name }))]} />
          <Select value={subjectId} onChange={onSubjectChange} options={[{ value: "", label: "Select Subject" }, ...subjects.map(s => ({ value: s._id || s.id || "", label: s.name }))]} disabled={!classId} />
          <Select value={typeFilter} onChange={onTypeChange} options={[{ value: "", label: "All Types" }, { value: "mcq", label: "MCQ" }, { value: "short", label: "Short" }, { value: "long", label: "Long" }]} />
          <Select value={difficultyFilter} onChange={onDifficultyChange} options={[{ value: "", label: "All Difficulty" }, { value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} />
          <Select value={marksFilter} onChange={onMarksChange} options={[{ value: "", label: "All Marks" }, { value: "1", label: "1 mark" }, { value: "2", label: "2 marks" }, { value: "3", label: "3 marks" }, { value: "5", label: "5 marks" }, { value: "8", label: "8 marks" }, { value: "10", label: "10 marks" }]} />
          <div className="relative flex-1 min-w-[200px]">
            <AppIcon name="Search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search questions..." className="w-full h-9 rounded-lg border border-slate-200 pl-8 pr-3 text-xs font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none" />
          </div>
        </div>

        {/* Multi-Chapter Selection */}
        {classId && subjectId && chapters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapters:</span>
            {chapters.map(ch => {
              const active = selectedChapterIds.includes(ch._id || ch.id || "");
              return (
                <button key={ch._id || ch.id} onClick={() => onToggleChapter(ch._id || ch.id || "")} className={`h-7 px-2.5 rounded-md text-[10px] font-bold border transition-colors ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                  {ch.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Questions List */}
      {!classId && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <AppIcon name="Library" size={36} className="text-slate-200 mb-3" />
          <p className="text-sm font-medium text-slate-500">Select a class to load questions from the bank</p>
        </div>
      )}

      {classId && isLoading && (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      )}

      {classId && !isLoading && questions.length === 0 && (
        <DataState variant="empty" title="No questions found" message="Try different filters or add questions to the bank first." />
      )}

      {classId && !isLoading && questions.length > 0 && (
        <>
          {/* Select All Row */}
          <div className="flex items-center justify-between px-1">
            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 cursor-pointer">
              <input type="checkbox" checked={questions.length > 0 && questions.every(q => selectedIds.has(q._id))} onChange={() => { if (questions.every(q => selectedIds.has(q._id))) onClearSelection(); else onSelectAll(); }} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Select all ({questions.length})
            </label>
            <span className="text-[10px] text-slate-400">{questions.length} questions available</span>
          </div>

          {/* Question Cards */}
          <div className="space-y-2">
            {questions.map(q => (
              <QuestionSelectCard key={q._id} question={q} selected={selectedIds.has(q._id)} onToggle={() => onToggleSelect(q._id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// ─── Question Select Card ────────────────────────────────────────────────

function QuestionSelectCard({ question: q, selected, onToggle }: { question: QuestionRow; selected: boolean; onToggle: () => void }) {
  const opts = useMemo(() => {
    if (!q.options) return [];
    try {
      const parsed = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [q.options]);

  return (
    <div onClick={onToggle} className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${selected ? "border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300 hover:shadow-sm"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={selected} onChange={onToggle} onClick={e => e.stopPropagation()} className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-800 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.question_html) }} />
          {q.type === "mcq" && opts.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {opts.map((opt: any, i: number) => (
                <p key={i} className={`text-[11px] px-2.5 py-1 rounded-md ${opt.is_correct ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>
                  ({String.fromCharCode(65 + i)}) {opt.option_text} {opt.is_correct && "✓"}
                </p>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${q.type === "mcq" ? "bg-indigo-50 text-indigo-600" : q.type === "short" ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600"}`}>{q.type.toUpperCase()}</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{q.difficulty}</span>
            {(q.marks || 0) > 0 && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{q.marks} marks</span>}
            {q.chapter_name && <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{q.chapter_name}</span>}
            {q.is_global && <span className="text-[9px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Global</span>}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Paper Settings
// ═══════════════════════════════════════════════════════════════════════════

function PaperSettingsStep({
  examName, setExamName, paperTitle, setPaperTitle,
  totalTime, setTotalTime, passingMarks, setPassingMarks,
  instructions, setInstructions, teacherId, setTeacherId,
  date, setDate, teachers, selectedCount, totalMarks,
  mcqCount, shortCount, longCount,
}: {
  examName: string; setExamName: (v: string) => void
  paperTitle: string; setPaperTitle: (v: string) => void
  totalTime: string; setTotalTime: (v: string) => void
  passingMarks: number; setPassingMarks: (v: number) => void
  instructions: string; setInstructions: (v: string) => void
  teacherId: string; setTeacherId: (v: string) => void
  date: string; setDate: (v: string) => void
  teachers: TeacherRow[]
  selectedCount: number; totalMarks: number
  mcqCount: number; shortCount: number; longCount: number
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold opacity-90">Paper Summary</p>
            <p className="text-2xl font-extrabold mt-1">{selectedCount} Questions · {totalMarks} Marks</p>
          </div>
          <div className="flex gap-4 text-sm font-bold">
            <div className="text-center"><p className="text-xl">{mcqCount}</p><p className="text-[10px] opacity-70">MCQ</p></div>
            <div className="text-center"><p className="text-xl">{shortCount}</p><p className="text-[10px] opacity-70">Short</p></div>
            <div className="text-center"><p className="text-xl">{longCount}</p><p className="text-[10px] opacity-70">Long</p></div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-900">Paper Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Exam Name *" value={examName} onChange={setExamName} placeholder="e.g. Mid-Term Examination 2026" />
          <Field label="Paper Title" value={paperTitle} onChange={setPaperTitle} placeholder="e.g. Mathematics Paper-I" />
          <Field label="Total Time" value={totalTime} onChange={setTotalTime} placeholder="e.g. 3 Hours" />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500">Passing Marks</label>
            <input type="number" min={0} value={passingMarks} onChange={e => setPassingMarks(+e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500">Teacher</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-indigo-500 outline-none">
              <option value="">Optional</option>
              {teachers.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-500 outline-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500">Instructions</label>
          <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} placeholder="Enter exam instructions..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none" />
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Paper Preview
// ═══════════════════════════════════════════════════════════════════════════

function PaperPreviewStep({
  schoolName, examName, paperTitle, className, subjectName,
  teacherName, date, totalTime, passingMarks, instructions,
  questions, totalMarks,
}: {
  schoolName: string; examName: string; paperTitle: string
  className: string; subjectName: string; teacherName: string
  date: string; totalTime: string; passingMarks: number
  instructions: string; questions: QuestionRow[]; totalMarks: number
}) {
  const mcqs = questions.filter(q => q.type === "mcq");
  const shorts = questions.filter(q => q.type === "short");
  const longs = questions.filter(q => q.type === "long");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 md:p-12 min-h-[700px]">
          {/* Paper Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900">{schoolName}</h1>
            {examName && <p className="text-base font-bold text-slate-700 mt-1">{examName}</p>}
            {paperTitle && <p className="text-sm font-semibold text-slate-600 mt-0.5">{paperTitle}</p>}
            <div className="flex items-center justify-between mt-4 text-xs text-slate-600 border-t border-slate-200 pt-3">
              {className && <span><strong>Class:</strong> {className}</span>}
              {subjectName && <span><strong>Subject:</strong> {subjectName}</span>}
              {teacherName && <span><strong>Teacher:</strong> {teacherName}</span>}
              {date && <span><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString()}</span>}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span><strong>Total Marks:</strong> {totalMarks}</span>
              {totalTime && <span><strong>Time:</strong> {totalTime}</span>}
              {passingMarks > 0 && <span><strong>Passing:</strong> {passingMarks}</span>}
              <span><strong>Questions:</strong> {questions.length}</span>
            </div>
          </div>

          {/* Instructions */}
          {instructions && (
            <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Instructions</p>
              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">{instructions}</div>
            </div>
          )}

          {/* Section A: MCQs */}
          {mcqs.length > 0 && (
            <SectionBlock title="Section A — Multiple Choice Questions" subtitle={`(${mcqs.reduce((s, q) => s + (q.marks || 0), 0)} Marks)`} questions={mcqs} startIdx={0} showOptions />
          )}

          {/* Section B: Short Questions */}
          {shorts.length > 0 && (
            <SectionBlock title="Section B — Short Questions" subtitle={`(${shorts.reduce((s, q) => s + (q.marks || 0), 0)} Marks)`} questions={shorts} startIdx={mcqs.length} lines={2} />
          )}

          {/* Section C: Long Questions */}
          {longs.length > 0 && (
            <SectionBlock title="Section C — Long Questions" subtitle={`(${longs.reduce((s, q) => s + (q.marks || 0), 0)} Marks)`} questions={longs} startIdx={mcqs.length + shorts.length} lines={5} />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, subtitle, questions, startIdx, showOptions, lines }: {
  title: string; subtitle: string; questions: QuestionRow[]; startIdx: number; showOptions?: boolean; lines?: number
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between border-b border-slate-300 pb-1 mb-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h2>
        <span className="text-[10px] font-bold text-slate-500">{subtitle}</span>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => {
          const opts = (() => { try { const p = typeof q.options === "string" ? JSON.parse(q.options) : q.options; return Array.isArray(p) ? p : []; } catch { return []; } })();
          return (
            <div key={q._id} className="text-sm text-slate-800">
              <p className="font-medium leading-relaxed">
                <strong className="text-slate-900">Q{startIdx + i + 1}.</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.question_html) }} />
                <span className="text-slate-400 ml-2 text-xs">({q.marks} Marks)</span>
              </p>
              {showOptions && opts.length > 0 && (
                <div className="ml-6 mt-1.5 grid grid-cols-2 gap-1">
                  {opts.map((opt: any, oi: number) => (
                    <p key={oi} className="text-xs text-slate-600">({"abcd"[oi]}) {opt.option_text}</p>
                  ))}
                </div>
              )}
              {lines && lines > 0 && (
                <div className="ml-6 mt-2 space-y-2">
                  {Array.from({ length: lines }).map((_, li) => <div key={li} className="border-b border-dashed border-slate-300 h-5" />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// Shared UI Components
// ═══════════════════════════════════════════════════════════════════════════

function Select({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} className={`h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold bg-white focus:border-indigo-500 outline-none min-w-[120px] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none placeholder:text-slate-300" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Print Helper
// ═══════════════════════════════════════════════════════════════════════════

function printPaper(data: {
  schoolName: string; examName: string; paperTitle: string
  className: string; subjectName: string; teacherName: string
  date: string; totalTime: string; passingMarks: number
  instructions: string; questions: QuestionRow[]; totalMarks: number
}) {
  const { schoolName, examName, paperTitle, className, subjectName, teacherName, date, totalTime, passingMarks, instructions, questions, totalMarks } = data;
  const mcqs = questions.filter(q => q.type === "mcq");
  const shorts = questions.filter(q => q.type === "short");
  const longs = questions.filter(q => q.type === "long");

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const renderSection = (title: string, qs: QuestionRow[], start: number, showOpts: boolean, lineCount: number) => {
    if (qs.length === 0) return "";
    const sectionMarks = qs.reduce((s, q) => s + (q.marks || 0), 0);
    let html = `<section><h2>${title} <span class="sm">(${sectionMarks} Marks)</span></h2>`;
    qs.forEach((q, i) => {
      const opts = (() => { try { const p = typeof q.options === "string" ? JSON.parse(q.options) : q.options; return Array.isArray(p) ? p : []; } catch { return []; } })();
      html += `<div class="q"><strong>Q${start + i + 1}.</strong> ${q.question_html} <span class="m">(${q.marks} Marks)</span></div>`;
      if (showOpts && opts.length > 0) {
        html += `<div class="opts">${opts.map((o: any, oi: number) => `<span>(${"abcd"[oi]}) ${esc(o.option_text)}</span>`).join("")}</div>`;
      }
      if (lineCount > 0) {
        html += `<div class="lines">${"<div class='line'></div>".repeat(lineCount)}</div>`;
      }
    });
    html += "</section>";
    return html;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(paperTitle || examName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Georgia,serif;padding:40px 50px;color:#1e293b;font-size:13px;line-height:1.6}
.header{text-align:center;border-bottom:3px double #1e293b;padding-bottom:14px;margin-bottom:20px}
.header h1{font-size:22px;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px}
.header h2{font-size:16px;font-weight:600;margin-bottom:2px}
.header h3{font-size:14px;font-weight:500;color:#475569}
.meta{display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:#475569}
.instructions{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:20px;font-size:11px;white-space:pre-line}
.instructions strong{display:block;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px}
section{margin-bottom:24px}
section h2{font-size:13px;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid #cbd5e1;padding-bottom:4px;margin-bottom:12px;font-weight:700}
section h2 .sm{font-weight:400;font-size:11px;color:#64748b}
.q{margin:10px 0 4px;line-height:1.7}
.m{color:#64748b;font-weight:normal;font-size:11px}
.opts{margin:4px 0 8px 24px;display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:12px}
.lines{margin:6px 0 12px 24px}
.line{border-bottom:1px dashed #94a3b8;height:20px}
@media print{body{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="header">
<h1>${esc(schoolName)}</h1>
${examName ? `<h2>${esc(examName)}</h2>` : ""}
${paperTitle ? `<h3>${esc(paperTitle)}</h3>` : ""}
<div class="meta">
${className ? `<span><strong>Class:</strong> ${esc(className)}</span>` : ""}
${subjectName ? `<span><strong>Subject:</strong> ${esc(subjectName)}</span>` : ""}
${teacherName ? `<span><strong>Teacher:</strong> ${esc(teacherName)}</span>` : ""}
${date ? `<span><strong>Date:</strong> ${new Date(date + "T00:00:00").toLocaleDateString()}</span>` : ""}
</div>
<div class="meta">
<span><strong>Total Marks:</strong> ${totalMarks}</span>
${totalTime ? `<span><strong>Time:</strong> ${esc(totalTime)}</span>` : ""}
${passingMarks > 0 ? `<span><strong>Passing:</strong> ${passingMarks}</span>` : ""}
<span><strong>Questions:</strong> ${questions.length}</span>
</div>
</div>
${instructions ? `<div class="instructions"><strong>Instructions:</strong>\n${esc(instructions)}</div>` : ""}
${renderSection("Section A — Multiple Choice Questions", mcqs, 0, true, 0)}
${renderSection("Section B — Short Questions", shorts, mcqs.length, false, 2)}
${renderSection("Section C — Long Questions", longs, mcqs.length + shorts.length, false, 5)}
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.onload = () => { setTimeout(() => { w.focus(); w.print(); }, 250); };
}
