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

interface ClassRow { _id: string; id?: string; name: string; }
interface TeacherRow { _id: string; id?: string; first_name: string; last_name: string; }
interface SubjectRow { _id: string; id?: string; name: string; }
interface ChapterRow { _id: string; id?: string; title: string; subject_id?: string; class_id?: string; is_default?: boolean; }
interface QuestionRow { _id: string; id?: string; question_html: string; type: string; difficulty: string; subject_id?: string; chapter_id?: string; class_id?: string; options?: any; marks?: number; }

export function QuestionPaperCreatePage() {
  const navigate = useNavigate();
  const { create } = useQuestionPapers();
  const { schoolName } = useSchoolBranding();
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);

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

  // Fetch subjects for selected class
  const { state: subjectState, run: runSubjects } = useSafeAsync<SubjectRow[]>();
  useEffect(() => {
    if (!classId) {
      setSubjectId("");
      return;
    }
    void runSubjects(async () => {
      const r = await serviceRequest<any>(`/api/classes/${classId}/subjects`);
      if (!r.ok) throw new Error("Failed to load subjects");
      const raw = r.data;
      if (Array.isArray(raw)) return raw;
      if (raw?.data && Array.isArray(raw.data)) return raw.data;
      if (raw?.items && Array.isArray(raw.items)) return raw.items;
      return [];
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

  // Seed default chapters when subject is selected
  useEffect(() => {
    if (!classId || !subjectId) return;
    void (async () => {
      await serviceRequest<any>("/api/chapters/seed-defaults", {
        method: "POST",
        body: JSON.stringify({ class_id: classId, subject_id: subjectId }),
      });
      // Reload chapters after seeding
      const r = await serviceRequest<any>(`/api/chapters?class_id=${classId}&subject_id=${subjectId}`);
      if (r.ok) {
        const raw = r.data;
        const chapters = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
        chapterState.data = chapters;
      }
    })();
  }, [classId, subjectId]);

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
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
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
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-sm hover:bg-indigo-700 transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <span className="material-symbols-outlined text-3xl text-slate-200 mb-2">quiz</span>
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
                        <span className="text-[9px] font-bold text-slate-500">{q.marks} marks</span>
                        <span className="text-[9px] text-slate-400 capitalize">{q.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveQuestion(q.id, "up")} disabled={idx === 0} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm">arrow_upward</span>
                      </button>
                      <button onClick={() => moveQuestion(q.id, "down")} disabled={idx === questions.length - 1} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30">
                        <span className="material-symbols-outlined text-sm">arrow_downward</span>
                      </button>
                      <button onClick={() => removeQuestion(q.id)} className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600">
                        <span className="material-symbols-outlined text-sm">close</span>
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
              <span className="material-symbols-outlined text-sm mr-1">print</span>
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
                      {q.type === "short" && (
                        <div className="ml-6 mt-2 border-b border-dashed border-slate-300 w-full h-6" />
                      )}
                      {q.type === "long" && (
                        <div className="ml-6 mt-2 space-y-3">
                          <div className="border-b border-dashed border-slate-300 w-full h-4" />
                          <div className="border-b border-dashed border-slate-300 w-full h-4" />
                          <div className="border-b border-dashed border-slate-300 w-full h-4" />
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
            <span className="material-symbols-outlined text-lg">close</span>
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
                <span className="material-symbols-outlined text-sm mr-1.5">{saving ? "hourglass_empty" : "add"}</span>
                {saving ? "Creating..." : "Create & Add to Paper"}
              </Button>
            </div>
          ) : (
            /* Repository Tab */
            <div className="space-y-3">
              {bankQuestions.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-200 mb-2">library_books</span>
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
