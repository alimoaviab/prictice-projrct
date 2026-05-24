import { AppIcon } from "shared/ui/AppIcon";
/**
 * Create Question Paper — Full flow with integrated question creation.
 * 
 * CRITICAL: NO PAGE RELOAD on any action. Everything is React state + API calls.
 * - Class → Subject → Chapter → Question flow
 * - Multi-chapter selection support
 * - Questions stored in internal repository
 * - Preview: live from state
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button, Skeleton } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { useQuestionPapers } from "../hooks/useQuestionPapers";
import type { PaperQuestion, QuestionType, Difficulty } from "../types/questionPaper.types";
import { showToast } from "@/utils/toast";
import { autoGeneratePaper } from "@/modules/question-bank/services/questionBank.service";
import type { BankQuestion } from "@/modules/question-bank/types/questionBank.types";

interface ClassRow { _id: string; id?: string; name: string; }
interface TeacherRow { _id: string; id?: string; first_name: string; last_name: string; }
interface SubjectRow { _id: string; id?: string; name: string; }
interface ChapterRow { _id: string; id?: string; title: string; subject_id?: string; class_id?: string; is_default?: boolean; }
interface QuestionRow { _id: string; id?: string; question_html: string; type: string; difficulty: string; subject_id?: string; chapter_id?: string; class_id?: string; options?: any; marks?: number; chapter_name?: string; subject_name?: string; class_name?: string; is_global?: boolean; created_by_name?: string; }

export function QuestionPaperCreatePage() {
  const navigate = useNavigate();
  const { create } = useQuestionPapers();
  const { schoolName } = useSchoolBranding();
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);

  // Load pre-selected questions from Question Bank (if navigated from there)
  useEffect(() => {
    const stored = sessionStorage.getItem("paper_selected_questions");
    if (stored) {
      sessionStorage.removeItem("paper_selected_questions");
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const paperQs: PaperQuestion[] = parsed.map((q: any, i: number) => {
            let opts: string[] | undefined;
            let correct: string | undefined;
            if (q.type === "mcq" && q.options) {
              try {
                const optsParsed = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
                if (Array.isArray(optsParsed)) {
                  opts = optsParsed.map((o: any) => o.option_text);
                  const c = optsParsed.find((o: any) => o.is_correct);
                  correct = c?.option_text;
                }
              } catch {/* */}
            }
            return {
              id: `bank_${q._id}`,
              type: q.type as QuestionType,
              question: q.question_html,
              marks: q.marks || 5,
              difficulty: q.difficulty as Difficulty,
              options: opts,
              correct_answer: correct,
              sort_order: i + 1,
            };
          });
          setQuestions(paperQs);
          // Auto-set class and subject from the first question's metadata
          const first = parsed[0];
          if (first?.class_id) setClassId(first.class_id);
          if (first?.subject_id) setSubjectId(first.subject_id);
          showToast(`${paperQs.length} questions loaded from bank.`, "success");
        }
      } catch {/* ignore */}
    }
  }, []);

  // Fetch classes
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) throw new Error("Failed to load classes");
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    });
  }, [runClasses]);

  // Fetch teachers
  const { state: teacherState, run: runTeachers } = useSafeAsync<TeacherRow[]>();
  useEffect(() => {
    void runTeachers(async () => {
      const r = await serviceRequest<any>("/api/teachers");
      if (!r.ok) throw new Error("Failed to load teachers");
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    });
  }, [runTeachers]);

  // Fetch subjects for selected class.
  // Backend returns { subjects: [{ name, total_marks, ... }] } from
  // /api/classes/:id/subjects (no _id), so we normalize and fall back
  // to /api/subjects when the class has none assigned.
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  useEffect(() => {
    if (!classId) {
      setSubjectId("");
      return;
    }
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
      const r2 = await serviceRequest<any>("/api/subjects");
      if (!r2.ok) return [];
      return normalize(r2.data);
    });
  }, [runSubjects, classId]);

  // Fetch chapters for selected class/subject
  const { state: chapterState, run: runChapters } = useSafeAsync<ChapterRow[]>();
  useEffect(() => {
    if (!classId || !subjectId) {
      setSelectedChapterIds([]);
      return;
    }
    void runChapters(async () => {
      const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
      if (!r.ok) throw new Error("Failed to load chapters");
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    });
  }, [runChapters, classId, subjectId]);

  // Seed default chapters when subject is selected; refetch chapters on success
  useEffect(() => {
    if (!classId || !subjectId) return;
    void (async () => {
      await serviceRequest<any>("/api/chapters/seed-defaults", {
        method: "POST",
        body: JSON.stringify({ class_id: classId, subject_id: subjectId }),
      });
      // Reload chapters via the runChapters helper so React state updates.
      await runChapters(async () => {
        const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
        if (!r.ok) return [];
        const raw = r.data;
        return Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
      });
    })();
  }, [classId, subjectId, runChapters]);

  // Fetch questions for selected filters
  const { state: questionState, run: runQuestions } = useSafeAsync<QuestionRow[]>();
  useEffect(() => {
    if (!classId) return;
    void runQuestions(async () => {
      const params = new URLSearchParams({ class_id: classId });
      if (subjectId) params.set("subject_id", subjectId);
      if (selectedChapterIds.length === 1) params.set("chapter_id", selectedChapterIds[0]);
      const r = await serviceRequest<any>(`/api/questions?${params.toString()}`);
      if (!r.ok) throw new Error("Failed to load questions");
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
    });
  }, [runQuestions, classId, subjectId, selectedChapterIds]);

  // School settings
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();
  useEffect(() => {
    void runSettings(async () => {
      const r = await serviceRequest<any>("/api/settings");
      return r.ok ? r.data : null;
    }).catch(() => {});
  }, [runSettings]);

  const classes = classState.data || [];
  const teachers = teacherState.data || [];
  const subjects = subjectState.data || [];
  const chapters = chapterState.data || [];
  const bankQuestions = questionState.data || [];
  const resolvedSchoolName = settingsState.data?.profile?.school_name || schoolName || "";

  const selectedClass = classes.find((c) => (c._id || c.id) === classId);
  const selectedTeacher = teachers.find((t) => (t._id || t.id) === teacherId);
  const teacherName = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "";

  const isLoading = classState.status === "loading" || classState.status === "idle";

  // Toggle chapter selection
  const toggleChapter = useCallback((chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId) ? prev.filter((id) => id !== chapterId) : [...prev, chapterId]
    );
  }, []);

  // Select all chapters
  const selectAllChapters = useCallback(() => {
    setSelectedChapterIds(chapters.map((c) => c._id || c.id!));
  }, [chapters]);

  // Clear chapter selection
  const clearChapters = useCallback(() => {
    setSelectedChapterIds([]);
  }, []);

  // Add question to paper (no reload)
  const addQuestion = useCallback((q: PaperQuestion) => {
    setQuestions((prev) => [...prev, { ...q, sort_order: prev.length + 1 }]);
  }, []);

  // Remove question (no reload)
  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, sort_order: i + 1 })));
  }, []);

  // Move question up/down (no reload)
  const moveQuestion = useCallback((id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy.map((q, i) => ({ ...q, sort_order: i + 1 }));
    });
  }, []);

  // Update marks for a question (no reload)
  const updateMarks = useCallback((id: string, marks: number) => {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, marks: Math.max(1, marks) } : q));
  }, []);

  // Save paper
  async function handleSave() {
    if (!title.trim() || !classId) {
      showToast("Please enter a title and select a class.", "error");
      return;
    }
    setSaving(true);
    try {
      const result = await create({
        title: title.trim(),
        class_id: classId,
        subject_id: subjectId || undefined,
        chapter_ids: selectedChapterIds.length > 0 ? selectedChapterIds : undefined,
        teacher_id: teacherId || undefined,
        date: date || undefined,
        questions,
      });
      if (result && (result as any).ok !== false) {
        navigate("/admin/question-papers");
      }
    } finally {
      setSaving(false);
    }
  }

  // Print
  function handlePrint() {
    window.print();
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/question-papers"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group"
        >
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Question Papers
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ─── LEFT: Form + Questions ─────────────────────────────────── */}
        <div className="w-full lg:w-[42%] space-y-4">
          {/* Paper Details */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Paper Details</h2>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Paper Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mathematics Mid-Term Paper"
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none placeholder:text-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Class *</label>
                    <select
                      value={classId}
                      onChange={(e) => { setClassId(e.target.value); setSubjectId(""); setSelectedChapterIds([]); }}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => { setSubjectId(e.target.value); setSelectedChapterIds([]); }}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Multi-Chapter Selection */}
                {classId && subjectId && chapters.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500">Chapters</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={selectAllChapters} className="text-[10px] font-bold text-indigo-600 hover:underline">All</button>
                        <button type="button" onClick={clearChapters} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Clear</button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-2">
                      {chapters.map((ch) => {
                        const checked = selectedChapterIds.includes(ch._id || ch.id!);
                        return (
                          <label key={ch._id || ch.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleChapter(ch._id || ch.id!)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-slate-700">{ch.title}</span>
                            {ch.is_default && <span className="text-[9px] text-slate-400">(default)</span>}
                          </label>
                        );
                      })}
                    </div>
                    {selectedChapterIds.length > 0 && (
                      <p className="text-[10px] text-slate-400">{selectedChapterIds.length} chapter(s) selected</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Teacher</label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Optional</option>
                      {teachers.map((t) => (
                        <option key={t._id || t.id} value={t._id || t.id}>{t.first_name} {t.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Added Questions */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Questions ({questions.length})
                {totalMarks > 0 && <span className="text-slate-400 font-normal ml-2">· {totalMarks} marks</span>}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBankDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 text-white text-[11px] font-bold shadow-sm hover:bg-violet-700 transition-colors active:scale-[0.98]"
                  title="Browse & select from Question Bank"
                >
                  <AppIcon name="Library" size={14} />
                  Question Bank
                </button>
                <button
                  type="button"
                  onClick={() => setAutoGenOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-sm hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                  title="Auto-generate paper from question bank"
                >
                  <AppIcon name="Sparkles" size={14} />
                  Auto Generate
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-sm hover:bg-indigo-700 transition-colors active:scale-[0.98]"
                >
                  <AppIcon name="Plus" size={14} />
                  Add Question
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <AppIcon name="HelpCircle" size={30} className="text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-medium">No questions added yet</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="mt-3 text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  + Add your first question
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50 group hover:border-slate-200 transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5 shrink-0 w-5">Q{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{q.type.toUpperCase()}</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.marks}
                          onChange={(e) => updateMarks(q.id, parseInt(e.target.value) || 1)}
                          className="h-5 w-12 text-[9px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-1 text-center focus:border-indigo-500 outline-none"
                          title="Edit marks"
                        />
                        <span className="text-[9px] text-slate-400">marks</span>
                        <span className="text-[9px] text-slate-400 capitalize">{q.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveQuestion(q.id, "up")} disabled={idx === 0} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <AppIcon name="ArrowUp" size={14} />
                      </button>
                      <button onClick={() => moveQuestion(q.id, "down")} disabled={idx === questions.length - 1} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <AppIcon name="ArrowDown" size={14} />
                      </button>
                      <button onClick={() => removeQuestion(q.id)} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600">
                        <AppIcon name="X" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !title.trim() || !classId}>
              {saving ? "Saving..." : "Save Paper"}
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <AppIcon name="Printer" size={14} className="mr-1" />
              Print
            </Button>
          </div>
        </div>

        {/* ─── RIGHT: Live Preview ────────────────────────────────────── */}
        <div className="w-full lg:w-[58%] print:w-full">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 print:hidden">Live Preview</p>
          <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:rounded-none">
            <div className="p-6 md:p-10 min-h-[500px] print:p-0">
              {/* Paper Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-lg md:text-xl font-bold uppercase tracking-wider text-slate-900">
                  {resolvedSchoolName || "School Name"}
                </h1>
                {title && <p className="text-sm font-bold text-slate-700 mt-1">{title}</p>}

                <div className="flex items-center justify-between mt-3 text-xs text-slate-600">
                  {selectedClass && <span><strong>Class:</strong> {selectedClass.name}</span>}
                  {subjectId && subjects.length > 0 && <span><strong>Subject:</strong> {subjects.find(s => (s._id || s.id) === subjectId)?.name || ""}</span>}
                  {teacherName && <span><strong>Teacher:</strong> {teacherName}</span>}
                  {date && <span><strong>Date:</strong> {new Date(date + "T00:00:00").toLocaleDateString()}</span>}
                </div>

                {totalMarks > 0 && (
                  <div className="mt-2 text-[10px] font-bold text-slate-500">
                    Total Marks: {totalMarks} · Questions: {questions.length}
                  </div>
                )}
              </div>

              {/* Questions */}
              {questions.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                  <p className="text-sm text-slate-300 italic">Questions will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="text-sm text-slate-800">
                      <p className="font-medium">
                        <strong>Q{idx + 1}.</strong> {q.question}
                        <span className="text-slate-400 ml-2">({q.marks} Marks)</span>
                      </p>
                      {q.type === "mcq" && q.options && q.options.length > 0 && (
                        <div className="ml-6 mt-1.5 grid grid-cols-2 gap-1">
                          {q.options.map((opt, oi) => (
                            <p key={oi} className="text-xs text-slate-600">
                              ({String.fromCharCode(97 + oi)}) {opt}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add Question Drawer ──────────────────────────────────────── */}
      <AddQuestionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={addQuestion}
        classId={classId}
        subjectId={subjectId}
        selectedChapterIds={selectedChapterIds}
        bankQuestions={bankQuestions}
      />

      {/* ─── Auto-Generate Drawer ─────────────────────────────────────── */}
      <AutoGenerateDrawer
        isOpen={autoGenOpen}
        onClose={() => setAutoGenOpen(false)}
        classId={classId}
        subjectId={subjectId}
        chapterIds={selectedChapterIds}
        onGenerated={(picked) => {
          setQuestions((prev) => {
            const start = prev.length;
            const newOnes: PaperQuestion[] = picked.map((q, i) => {
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
                } catch {/* ignore */}
              }
              return {
                id: `gen_${q._id}_${Date.now()}_${i}`,
                type: q.type as QuestionType,
                question: q.question_html,
                marks: (q as any).assigned_marks || q.marks || 5,
                difficulty: q.difficulty as Difficulty,
                options: opts,
                correct_answer: correct,
                sort_order: start + i + 1,
              };
            });
            return [...prev, ...newOnes];
          });
          setAutoGenOpen(false);
        }}
      />

      {/* ─── Question Bank Drawer ─────────────────────────────────────── */}
      <QuestionBankBrowseDrawer
        isOpen={bankDrawerOpen}
        onClose={() => setBankDrawerOpen(false)}
        classId={classId}
        subjectId={subjectId}
        chapterIds={selectedChapterIds}
        alreadyAddedIds={new Set(questions.map((q) => q.id.replace(/^bank_/, "")))}
        onAddQuestions={(picked) => {
          setQuestions((prev) => {
            const start = prev.length;
            const newOnes: PaperQuestion[] = picked.map((q, i) => {
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
                } catch {/* ignore */}
              }
              return {
                id: `bank_${q._id}`,
                type: q.type as QuestionType,
                question: q.question_html,
                marks: q.marks || 5,
                difficulty: q.difficulty as Difficulty,
                options: opts,
                correct_answer: correct,
                sort_order: start + i + 1,
              };
            });
            return [...prev, ...newOnes];
          });
          setBankDrawerOpen(false);
          showToast(`${picked.length} question(s) added from bank.`, "success");
        }}
      />
    </div>
  );
}

// ─── Add Question Drawer ─────────────────────────────────────────────────

function AddQuestionDrawer({
  isOpen,
  onClose,
  onAdd,
  classId,
  subjectId,
  selectedChapterIds,
  bankQuestions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (q: PaperQuestion) => void;
  classId: string;
  subjectId: string;
  selectedChapterIds: string[];
  bankQuestions: QuestionRow[];
}) {
  const [tab, setTab] = useState<"create" | "bank">("create");

  // Create new question form state
  const [type, setType] = useState<QuestionType>("short");
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreateAndAdd() {
    if (!questionText.trim()) {
      showToast("Please enter the question text.", "error");
      return;
    }

    setSaving(true);
    try {
      // Save to internal repository
      const result = await serviceRequest<any>("/api/questions", {
        method: "POST",
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId || undefined,
          chapter_id: selectedChapterIds.length === 1 ? selectedChapterIds[0] : undefined,
          type,
          difficulty,
          question_html: questionText.trim(),
          options: type === "mcq" ? JSON.stringify(options.filter((o) => o.trim()).map((o, i) => ({ option_text: o.trim(), is_correct: o.trim() === correctAnswer }))) : undefined,
          marks,
        }),
      });

      if (!result.ok) {
        showToast(result.error?.message || "Failed to save question.", "error");
        return;
      }

      // Add to paper
      const newQuestion: PaperQuestion = {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        question: questionText.trim(),
        marks,
        difficulty,
        options: type === "mcq" ? options.filter((o) => o.trim()) : undefined,
        correct_answer: type === "mcq" ? correctAnswer : undefined,
        sort_order: 0,
      };

      onAdd(newQuestion);
      setQuestionText("");
      setMarks(5);
      setDifficulty("medium");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      showToast("Question created and added to paper.", "success");
    } finally {
      setSaving(false);
    }
  }

  function handleAddFromBank(q: QuestionRow) {
    const newQuestion: PaperQuestion = {
      id: `bank_${q._id || q.id}`,
      type: q.type as QuestionType,
      question: q.question_html,
      marks: q.marks || 5,
      difficulty: q.difficulty as Difficulty,
      options: q.type === "mcq" && q.options ? q.options.map((o: any) => o.option_text) : undefined,
      correct_answer: q.type === "mcq" && q.options ? q.options.find((o: any) => o.is_correct)?.option_text : undefined,
      sort_order: 0,
    };
    onAdd(newQuestion);
    showToast("Question added from repository.", "success");
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="max-w-lg">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Add Question</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <AppIcon name="X" size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          <button
            onClick={() => setTab("create")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === "create" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            Create New
          </button>
          <button
            onClick={() => setTab("bank")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === "bank" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
          >
            From Repository
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "create" ? (
            <div className="space-y-4">
              {/* Question Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Question Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["mcq", "short", "long"] as QuestionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`h-9 rounded-lg text-[11px] font-bold uppercase border transition-all ${
                        type === t
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {t === "mcq" ? "MCQ" : t === "short" ? "Short" : "Long"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">Question *</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  rows={3}
                  placeholder="Type your question here..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-y placeholder:text-slate-300"
                />
              </div>

              {/* MCQ Options */}
              {type === "mcq" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500">Options</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 w-4">{String.fromCharCode(65 + i)}</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...options];
                          copy[i] = e.target.value;
                          setOptions(copy);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm focus:border-indigo-500 outline-none placeholder:text-slate-300"
                      />
                    </div>
                  ))}
                  <div className="space-y-1 mt-2">
                    <label className="text-[10px] font-bold text-slate-500">Correct Answer</label>
                    <select
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-indigo-500 outline-none"
                    >
                      <option value="">Select correct option</option>
                      {options.filter((o) => o.trim()).map((o, i) => (
                        <option key={i} value={o}>{String.fromCharCode(65 + i)}: {o}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Marks + Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Marks</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={marks}
                    onChange={(e) => setMarks(Number(e.target.value) || 1)}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Add Button */}
              <Button onClick={handleCreateAndAdd} disabled={!questionText.trim() || saving} className="w-full h-10">
                <AppIcon name={saving ? "hourglass_empty" : "add"} size={14} className="mr-1.5" />
                {saving ? "Creating..." : "Create & Add to Paper"}
              </Button>
            </div>
          ) : (
            /* Repository Tab */
            <div className="space-y-3">
              {bankQuestions.length === 0 ? (
                <div className="py-8 text-center">
                  <AppIcon name="Library" size={30} className="text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No questions in repository yet</p>
                  <p className="text-[10px] text-slate-300 mt-1">Create questions to see them here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {bankQuestions.map((q) => (
                    <div key={q._id || q.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:border-slate-200 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-medium text-slate-800 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: q.question_html }}
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{q.type.toUpperCase()}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{q.difficulty}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromBank(q)}
                        className="h-7 px-2.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Auto-Generate Drawer ────────────────────────────────────────────────
//
// Calls POST /api/question-papers/auto-generate with class/subject/chapter
// scope + counts + difficulty ratio. Returns a balanced set of questions
// the teacher can pull into the paper builder.

function AutoGenerateDrawer({
  isOpen,
  onClose,
  classId,
  subjectId,
  chapterIds,
  onGenerated,
}: {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  subjectId: string;
  chapterIds: string[];
  onGenerated: (questions: BankQuestion[]) => void;
}) {
  const [mcqCount, setMcqCount] = useState(10);
  const [shortCount, setShortCount] = useState(5);
  const [longCount, setLongCount] = useState(2);
  const [easyRatio, setEasyRatio] = useState(30);
  const [mediumRatio, setMediumRatio] = useState(50);
  const [hardRatio, setHardRatio] = useState(20);
  const [mcqMarks, setMcqMarks] = useState(1);
  const [shortMarks, setShortMarks] = useState(3);
  const [longMarks, setLongMarks] = useState(8);
  const [generating, setGenerating] = useState(false);

  const totalMarks = mcqCount * mcqMarks + shortCount * shortMarks + longCount * longMarks;
  const ratioSum = easyRatio + mediumRatio + hardRatio;
  const ratioValid = ratioSum === 100;

  async function handleGenerate() {
    if (!classId) {
      showToast("Pick a class on the paper details first.", "error");
      return;
    }
    if (mcqCount + shortCount + longCount === 0) {
      showToast("Add at least one question count.", "error");
      return;
    }
    if (!ratioValid) {
      showToast("Difficulty ratios must add up to 100%.", "error");
      return;
    }

    setGenerating(true);
    try {
      const result = await autoGeneratePaper({
        class_id: classId,
        subject_id: subjectId || undefined,
        chapter_ids: chapterIds.length > 0 ? chapterIds : undefined,
        mcq_count: mcqCount,
        short_count: shortCount,
        long_count: longCount,
        easy_ratio: easyRatio / 100,
        medium_ratio: mediumRatio / 100,
        hard_ratio: hardRatio / 100,
        mcq_marks: mcqMarks,
        short_marks: shortMarks,
        long_marks: longMarks,
      });

      if (!result.ok) {
        showToast(result.error?.message || "Auto-generation failed.", "error");
        return;
      }

      const data = result.data;
      const picked = data?.questions ?? [];
      if (picked.length === 0) {
        showToast("No matching questions in the bank. Try wider chapters or lower counts.", "error");
        return;
      }
      showToast(`Generated ${picked.length} questions (${data?.total_marks ?? 0} marks).`, "success");
      onGenerated(picked as BankQuestion[]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="max-w-md">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AppIcon name="Sparkles" className="text-emerald-600" />
              Auto Generate Paper
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Balanced selection from the question bank</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <AppIcon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Counts */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Question Counts</p>
            <CountField label="MCQs" value={mcqCount} onChange={setMcqCount} marks={mcqMarks} onMarksChange={setMcqMarks} accent="indigo" />
            <CountField label="Short" value={shortCount} onChange={setShortCount} marks={shortMarks} onMarksChange={setShortMarks} accent="amber" />
            <CountField label="Long" value={longCount} onChange={setLongCount} marks={longMarks} onMarksChange={setLongMarks} accent="emerald" />
          </div>

          {/* Difficulty ratio */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Difficulty Ratio</p>
            <div className="grid grid-cols-3 gap-2">
              <RatioField label="Easy" value={easyRatio} onChange={setEasyRatio} accent="emerald" />
              <RatioField label="Medium" value={mediumRatio} onChange={setMediumRatio} accent="amber" />
              <RatioField label="Hard" value={hardRatio} onChange={setHardRatio} accent="red" />
            </div>
            <p className={`text-[10px] font-bold ${ratioValid ? "text-emerald-600" : "text-red-600"}`}>
              Total: {ratioSum}% {!ratioValid && "(must sum to 100%)"}
            </p>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500">Total Questions</p>
              <p className="text-sm font-extrabold text-slate-900">{mcqCount + shortCount + longCount}</p>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] font-bold text-slate-500">Total Marks</p>
              <p className="text-sm font-extrabold text-emerald-600">{totalMarks}</p>
            </div>
            {chapterIds.length > 0 && (
              <p className="text-[10px] text-slate-400 mt-2">{chapterIds.length} chapter(s) scoped</p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-200">
          <button
            onClick={handleGenerate}
            disabled={generating || !ratioValid || (mcqCount + shortCount + longCount === 0)}
            className="w-full h-10 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors active:scale-[0.98] inline-flex items-center justify-center gap-2"
          >
            <AppIcon name={generating ? "hourglass_empty" : "auto_awesome"} size={16} />
            {generating ? "Generating..." : "Generate Paper"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function CountField({
  label,
  value,
  onChange,
  marks,
  onMarksChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  marks: number;
  onMarksChange: (n: number) => void;
  accent: "indigo" | "amber" | "emerald";
}) {
  const tone = { indigo: "text-indigo-600", amber: "text-amber-600", emerald: "text-emerald-600" }[accent];
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2">
      <p className={`text-[11px] font-bold w-14 ${tone}`}>{label}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">−</button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
          className="h-7 w-12 rounded-md border border-slate-200 text-center text-sm font-bold focus:border-violet-500 outline-none"
        />
        <button onClick={() => onChange(value + 1)} className="h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">+</button>
      </div>
      <span className="text-[10px] text-slate-400 ml-auto">×</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={1}
          value={marks}
          onChange={(e) => onMarksChange(Math.max(1, parseInt(e.target.value || "1", 10)))}
          className="h-7 w-10 rounded-md border border-slate-200 text-center text-xs font-bold focus:border-violet-500 outline-none"
        />
        <span className="text-[10px] text-slate-400">marks</span>
      </div>
    </div>
  );
}

function RatioField({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  accent: "emerald" | "amber" | "red";
}) {
  const tone = {
    emerald: "border-emerald-300 text-emerald-700",
    amber: "border-amber-300 text-amber-700",
    red: "border-red-300 text-red-700",
  }[accent];
  return (
    <label className={`flex flex-col items-center gap-1 rounded-lg border ${tone} bg-white p-2`}>
      <span className="text-[9px] font-bold uppercase">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Math.min(100, Math.max(0, parseInt(e.target.value || "0", 10))))}
          className="h-7 w-10 rounded-md border border-slate-200 text-center text-sm font-bold outline-none focus:border-violet-500"
        />
        <span className="text-[10px] font-bold">%</span>
      </div>
    </label>
  );
}

// ─── Question Bank Browse Drawer ─────────────────────────────────────────
//
// Full-width side drawer that shows the Question Bank with all filters.
// Teacher can browse, filter, and select multiple questions via checkboxes,
// then add them all to the paper at once.

function QuestionBankBrowseDrawer({
  isOpen,
  onClose,
  classId,
  subjectId,
  chapterIds,
  alreadyAddedIds,
  onAddQuestions,
}: {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  subjectId: string;
  chapterIds: string[];
  alreadyAddedIds: Set<string>;
  onAddQuestions: (questions: QuestionRow[]) => void;
}) {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterChapter, setFilterChapter] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [chapters, setChapters] = useState<ChapterRow[]>([]);

  // Load questions when drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelectedIds(new Set());
    const params = new URLSearchParams();
    if (classId) params.set("class_id", classId);
    if (subjectId) params.set("subject_id", subjectId);
    serviceRequest<any>(`/api/questions?${params.toString()}`).then((r) => {
      if (r.ok) {
        const raw = r.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
        setQuestions(list);
      }
      setLoading(false);
    });
    // Load chapters
    if (classId && subjectId) {
      serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`).then((r) => {
        if (r.ok) {
          const raw = r.data;
          setChapters(Array.isArray(raw) ? raw : raw?.data || raw?.items || []);
        }
      });
    }
  }, [isOpen, classId, subjectId]);

  // Client-side filtering
  const filtered = useMemo(() => {
    let qs = questions;
    if (filterType) qs = qs.filter((q) => q.type === filterType);
    if (filterDifficulty) qs = qs.filter((q) => q.difficulty === filterDifficulty);
    if (filterChapter) qs = qs.filter((q) => q.chapter_id === filterChapter);
    if (filterSearch) {
      const s = filterSearch.toLowerCase();
      qs = qs.filter((q) => q.question_html.toLowerCase().includes(s));
    }
    return qs;
  }, [questions, filterType, filterDifficulty, filterChapter, filterSearch]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((q) => q._id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function handleAdd() {
    const picked = questions.filter((q) => selectedIds.has(q._id));
    onAddQuestions(picked);
  }

  const selectedMarks = useMemo(() => {
    return questions.filter((q) => selectedIds.has(q._id)).reduce((s, q) => s + (q.marks || 0), 0);
  }, [questions, selectedIds]);

  const selectedMcq = useMemo(() => questions.filter((q) => selectedIds.has(q._id) && q.type === "mcq").length, [questions, selectedIds]);
  const selectedShort = useMemo(() => questions.filter((q) => selectedIds.has(q._id) && q.type === "short").length, [questions, selectedIds]);
  const selectedLong = useMemo(() => questions.filter((q) => selectedIds.has(q._id) && q.type === "long").length, [questions, selectedIds]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AppIcon name="Library" className="text-violet-600" />
              Question Bank
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Browse and select questions to add to your paper</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <AppIcon name="X" size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <AppIcon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search questions..."
                className="w-full h-8 rounded-lg border border-slate-200 pl-8 pr-3 text-[11px] font-medium focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none"
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold bg-white focus:border-violet-500 outline-none">
              <option value="">All Types</option>
              <option value="mcq">MCQ</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
            </select>
            <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold bg-white focus:border-violet-500 outline-none">
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {chapters.length > 0 && (
              <select value={filterChapter} onChange={(e) => setFilterChapter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2 text-[11px] font-bold bg-white focus:border-violet-500 outline-none">
                <option value="">All Chapters</option>
                {chapters.map((ch) => <option key={ch._id || ch.id} value={ch._id || ch.id}>{ch.title}</option>)}
              </select>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{filtered.length} questions available</span>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-[10px] font-bold text-violet-600 hover:underline">Select All</button>
              <button onClick={clearAll} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Clear</button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center">
              <AppIcon name="HelpCircle" size={30} className="text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-medium">No questions found</p>
              <p className="text-[10px] text-slate-300 mt-1">Try different filters or add questions to the bank first</p>
            </div>
          )}

          {!loading && filtered.map((q) => {
            const isSelected = selectedIds.has(q._id);
            const isAlreadyAdded = alreadyAddedIds.has(q._id);
            let opts: any[] = [];
            if (q.type === "mcq" && q.options) {
              try { const p = typeof q.options === "string" ? JSON.parse(q.options) : q.options; if (Array.isArray(p)) opts = p; } catch {/* */}
            }
            return (
              <div
                key={q._id}
                onClick={() => !isAlreadyAdded && toggleSelect(q._id)}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${
                  isAlreadyAdded ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed" :
                  isSelected ? "border-violet-400 ring-2 ring-violet-100 bg-violet-50/30" :
                  "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isAlreadyAdded}
                    onChange={() => !isAlreadyAdded && toggleSelect(q._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500 disabled:opacity-50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-800 leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question_html }} />
                    {q.type === "mcq" && opts.length > 0 && (
                      <div className="mt-1.5 grid grid-cols-2 gap-1">
                        {opts.map((opt: any, i: number) => (
                          <p key={i} className={`text-[10px] px-2 py-0.5 rounded ${opt.is_correct ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-500"}`}>
                            ({String.fromCharCode(65 + i)}) {opt.option_text}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.type === "mcq" ? "bg-indigo-50 text-indigo-600" : q.type === "short" ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600"}`}>{q.type.toUpperCase()}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : q.difficulty === "hard" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{q.difficulty}</span>
                      {(q.marks || 0) > 0 && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{q.marks}m</span>}
                      {q.chapter_name && <span className="text-[9px] text-slate-400">{q.chapter_name}</span>}
                      {isAlreadyAdded && <span className="text-[9px] text-emerald-600 font-bold">✓ Added</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Bar */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] font-bold">
              <span className="text-slate-600">{selectedIds.size} selected</span>
              <span className="text-emerald-600">{selectedMarks} marks</span>
              <span className="text-indigo-500">{selectedMcq} MCQ</span>
              <span className="text-amber-500">{selectedShort} Short</span>
              <span className="text-violet-500">{selectedLong} Long</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="h-9 px-5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors active:scale-[0.98] inline-flex items-center gap-1.5"
            >
              <AppIcon name="Plus" size={14} />
              Add {selectedIds.size > 0 ? `${selectedIds.size} Questions` : "Selected"}
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
