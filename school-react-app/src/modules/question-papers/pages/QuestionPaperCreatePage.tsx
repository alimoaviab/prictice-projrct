/**
 * Create Question Paper — Full flow with Add Questions drawer.
 * 
 * CRITICAL: NO PAGE RELOAD on any action. Everything is React state + API calls.
 * - Adding questions: state update only
 * - Opening drawer: state toggle
 * - Saving: API call, no navigation
 * - Preview: live from state
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button, Input, Skeleton } from "@/components/ui";
import { Drawer } from "@/components/ui/Drawer";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { useQuestionPapers } from "../hooks/useQuestionPapers";
import type { PaperQuestion, QuestionType, Difficulty } from "../types/questionPaper.types";
import { showToast } from "@/utils/toast";

interface ClassRow { _id: string; id?: string; name: string; }
interface TeacherRow { _id: string; id?: string; first_name: string; last_name: string; }

// ─── Main Page Component ─────────────────────────────────────────────────

export function QuestionPaperCreatePage() {
  const navigate = useNavigate();
  const { create } = useQuestionPapers();
  const { schoolName } = useSchoolBranding();
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);

  // Fetch classes
  const { state: classState, run: runClasses } = useSafeAsync<ClassRow[]>();
  useEffect(() => {
    void runClasses(async () => {
      const r = await serviceRequest<any>("/api/classes");
      if (!r.ok) throw new Error("Failed to load classes");
      // Handle various response shapes
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
  const resolvedSchoolName = settingsState.data?.profile?.school_name || schoolName || "";

  const selectedClass = classes.find((c) => (c._id || c.id) === classId);
  const selectedTeacher = teachers.find((t) => (t._id || t.id) === teacherId);
  const teacherName = selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : "";

  const isLoading = classState.status === "loading" || classState.status === "idle";

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
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select Class</option>
                      {classes.map((c) => (
                        <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
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
      />
    </div>
  );
}

// ─── Add Question Drawer ─────────────────────────────────────────────────

function AddQuestionDrawer({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (q: PaperQuestion) => void;
}) {
  const [tab, setTab] = useState<"create" | "bank">("create");

  // Create new question form state
  const [type, setType] = useState<QuestionType>("short");
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  function resetForm() {
    setQuestionText("");
    setMarks(5);
    setDifficulty("medium");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
  }

  function handleAdd() {
    if (!questionText.trim()) {
      showToast("Please enter the question text.", "error");
      return;
    }

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
    resetForm();
    showToast("Question added to paper.", "success");
    // Don't close drawer — teacher might want to add more
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
            Question Bank
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
              <Button onClick={handleAdd} disabled={!questionText.trim()} className="w-full h-10">
                <span className="material-symbols-outlined text-sm mr-1.5">add</span>
                Add to Paper
              </Button>
            </div>
          ) : (
            /* Question Bank Tab — placeholder for future */
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-3">library_books</span>
              <p className="text-sm font-bold text-slate-500">Question Bank</p>
              <p className="text-xs text-slate-400 mt-1">
                Coming soon. You'll be able to search and select from previously created questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
