import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppIcon } from "shared/ui/AppIcon";

import {
  getAllChaptersFromConfig,
  getChapterUnitsFromConfig,
  getClassesFromConfig,
  getSyllabusOptions,
  getSubjectsFromConfig,
  loadSyllabusConfig,
  normalizeSyllabusId,
} from "@/data/syllabus";
import { getQuestionTypeLabel, normalizeQuestionTypeId, QUESTION_TYPES } from "@/data/question-types";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import type { BaseChapter, BaseUnit } from "@/components/syllabus/ChapterSelector";
import type { SyllabusConfig } from "@/data/syllabus";

interface QuestionRow {
  _id: string;
  id?: string;
  syllabus?: string;
  class_id?: string;
  class_name?: string;
  subject_id?: string;
  subject_name?: string;
  subject?: string;
  chapter_id?: string;
  chapter_name?: string;
  chapter?: string;
  question_html?: string;
  question?: string;
  questionType?: string;
  question_type?: string;
  type?: string;
  difficulty?: string;
  options?: unknown;
  answer?: string;
  marks?: number;
  metadata?: Record<string, unknown>;
}

interface PreviewQuestion {
  id: string;
  type: string;
  text: string;
  marks: number;
  chapter: string;
  options: string[];
  answer?: string;
}

const defaultInstructions =
  "Attempt all questions.\nWrite neatly and clearly.\nMarks are mentioned against each question.";

export function QuestionPaperGeneratorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [syllabusId, setSyllabusId] = useState(() => normalizeSyllabusId(searchParams.get("syllabus")));
  const [className, setClassName] = useState(() => searchParams.get("class") || "");
  const [subjectName, setSubjectName] = useState(() => searchParams.get("subject") || "");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(() =>
    (searchParams.get("chapters") || "").split(",").map((item) => item.trim()).filter(Boolean),
  );
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>(() =>
    QUESTION_TYPES.map((type) => type.id),
  );
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const [examName, setExamName] = useState("");
  const [totalTime, setTotalTime] = useState("3 Hours");
  const [date, setDate] = useState("");
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [syllabusConfig, setSyllabusConfig] = useState<SyllabusConfig | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  const syllabi = getSyllabusOptions();
  const classes = useMemo(() => getClassesFromConfig(syllabusConfig), [syllabusConfig]);
  const subjects = useMemo(
    () => (className ? getSubjectsFromConfig(syllabusConfig, className) : []),
    [syllabusConfig, className],
  );
  const chapterUnits = useMemo(
    () => (className && subjectName ? getChapterUnitsFromConfig(syllabusConfig, className, subjectName) : []),
    [syllabusConfig, className, subjectName],
  );
  const allChapters = useMemo(
    () => (className && subjectName ? getAllChaptersFromConfig(syllabusConfig, className, subjectName) : []),
    [syllabusConfig, className, subjectName],
  );

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    setCatalogError("");
    loadSyllabusConfig(syllabusId)
      .then((config) => {
        if (!active) return;
        setSyllabusConfig(config);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setSyllabusConfig(null);
        setCatalogError(error instanceof Error ? error.message : "Unable to load syllabus configuration.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [syllabusId]);

  const selectedChapterSet = useMemo(() => new Set(selectedChapterIds), [selectedChapterIds]);
  const selectedChapterTitles = useMemo(
    () =>
      new Set(
        allChapters
          .filter((chapter) => selectedChapterSet.has(chapter.id))
          .flatMap((chapter) => [chapter.title, chapter.code].map((value) => normalizeText(value))),
      ),
    [allChapters, selectedChapterSet],
  );
  const coverage = allChapters.length ? Math.round((selectedChapterIds.length / allChapters.length) * 100) : 0;

  const filteredQuestions = useMemo(() => {
    const query = normalizeText(search);
    return questions.filter((question) => {
      const type = normalizeQuestionTypeId(question.questionType || question.question_type || question.type);
      if (!selectedQuestionTypes.includes(type)) return false;

      if (selectedChapterIds.length > 0) {
        const chapterKeys = [
          question.chapter_id,
          question.chapter_name,
          question.chapter,
          question.metadata?.chapter as string | undefined,
        ]
          .filter(Boolean)
          .map((value) => normalizeText(String(value)));
        const matchesChapter = chapterKeys.some(
          (value) => selectedChapterSet.has(value) || selectedChapterTitles.has(value),
        );
        if (!matchesChapter) return false;
      }

      if (query) {
        const text = normalizeText(getQuestionText(question));
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [questions, search, selectedChapterIds.length, selectedChapterSet, selectedChapterTitles, selectedQuestionTypes]);

  const previewQuestions = useMemo<PreviewQuestion[]>(
    () =>
      filteredQuestions.map((question) => ({
        id: question._id || question.id || getQuestionText(question),
        type: normalizeQuestionTypeId(question.questionType || question.question_type || question.type),
        text: getQuestionText(question),
        marks: Number(question.marks || 1),
        chapter: question.chapter_name || question.chapter || "",
        options: parseOptions(question.options),
        answer: question.answer,
      })),
    [filteredQuestions],
  );
  const totalMarks = previewQuestions.reduce((sum, question) => sum + question.marks, 0);

  function syncUrl(next: {
    syllabus?: string;
    cls?: string;
    subject?: string;
    chapters?: string[];
  }) {
    const params = new URLSearchParams(searchParams);
    if (next.syllabus !== undefined) params.set("syllabus", next.syllabus);
    if (next.cls !== undefined) {
      if (next.cls) params.set("class", next.cls);
      else params.delete("class");
    }
    if (next.subject !== undefined) {
      if (next.subject) params.set("subject", next.subject);
      else params.delete("subject");
    }
    if (next.chapters !== undefined) {
      if (next.chapters.length) params.set("chapters", next.chapters.join(","));
      else params.delete("chapters");
    }
    setSearchParams(params, { replace: true });
  }

  function handleSyllabusChange(value: string) {
    const normalized = normalizeSyllabusId(value);
    setSyllabusId(normalized);
    setClassName("");
    setSubjectName("");
    setSelectedChapterIds([]);
    setQuestions([]);
    setGenerated(false);
    syncUrl({ syllabus: normalized, cls: "", subject: "", chapters: [] });
  }

  function handleClassChange(value: string) {
    setClassName(value);
    setSubjectName("");
    setSelectedChapterIds([]);
    setQuestions([]);
    setGenerated(false);
    syncUrl({ cls: value, subject: "", chapters: [] });
  }

  function handleSubjectChange(value: string) {
    setSubjectName(value);
    setSelectedChapterIds([]);
    setQuestions([]);
    setGenerated(false);
    syncUrl({ subject: value, chapters: [] });
  }

  function toggleChapter(chapterId: string) {
    const next = selectedChapterIds.includes(chapterId)
      ? selectedChapterIds.filter((id) => id !== chapterId)
      : [...selectedChapterIds, chapterId];
    setSelectedChapterIds(next);
    setGenerated(false);
    syncUrl({ chapters: next });
  }

  function toggleQuestionType(typeId: string) {
    setSelectedQuestionTypes((current) =>
      current.includes(typeId) ? current.filter((id) => id !== typeId) : [...current, typeId],
    );
    setGenerated(false);
  }

  async function handleGenerate() {
    if (!className || !subjectName) {
      showToast("Select syllabus, class and subject first.", "error");
      return;
    }
    if (!syllabusConfig || catalogLoading || catalogError) {
      showToast("Wait for the syllabus configuration to load.", "error");
      return;
    }
    if (allChapters.length > 0 && selectedChapterIds.length === 0) {
      showToast("Select at least one chapter.", "error");
      return;
    }
    if (selectedQuestionTypes.length === 0) {
      showToast("Select at least one question type.", "error");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        syllabus: syllabusId,
        class: className,
        subject: subjectName,
        status: "active",
      });
      if (selectedChapterIds.length === 1) {
        const selected = allChapters.find((chapter) => chapter.id === selectedChapterIds[0]);
        params.set("chapter", selected?.title || selectedChapterIds[0]);
      }
      if (selectedQuestionTypes.length === 1) {
        params.set("type", selectedQuestionTypes[0]);
        params.set("question_type", selectedQuestionTypes[0]);
      }

      const response = await serviceRequest<unknown>(`/api/questions?${params.toString()}`);
      const raw = response.ok ? response.data : [];
      const rows = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown[] })?.data)
          ? (raw as { data: QuestionRow[] }).data
          : Array.isArray((raw as { items?: unknown[] })?.items)
            ? (raw as { items: QuestionRow[] }).items
            : [];
      setQuestions(rows as QuestionRow[]);
      setGenerated(true);
      if (rows.length === 0) {
        showToast("No matching bank questions found for this filter set.", "error");
      } else {
        showToast(`Loaded ${rows.length} question bank records.`, "success");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!generated) {
      showToast("Generate the paper before saving.", "error");
      return;
    }
    if (previewQuestions.length === 0) {
      showToast("No questions available to save.", "error");
      return;
    }

    setSaving(true);
    try {
      const title = paperTitle.trim() || `${syllabusId.toUpperCase()} ${className} ${subjectName} Paper`;
      const response = await serviceRequest("/api/question-papers", {
        method: "POST",
        body: JSON.stringify({
          title,
          syllabus: syllabusId,
          class_id: className,
          class_name: className,
          subject_id: subjectName,
          subject_name: subjectName,
          chapter_ids: selectedChapterIds,
          questions: previewQuestions.map((question, index) => ({
            id: question.id,
            type: question.type,
            question: question.text,
            marks: question.marks,
            difficulty: "medium",
            options: question.options,
            correct_answer: question.answer,
            sort_order: index + 1,
          })),
          date: date || undefined,
        }),
      });

      if (response.ok) {
        showToast("Question paper saved.", "success");
        navigate("/admin/question-papers/saved");
      } else {
        showToast(response.message || "Could not save question paper.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/question-papers"
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Question Paper Generator</h1>
            <p className="text-[12px] text-slate-500">
              Syllabus to classes to subjects to chapters to dynamic question types
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || catalogLoading}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors inline-flex items-center gap-2"
          >
            <AppIcon name={loading ? "Loader2" : "Sparkles"} size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Generating..." : "Generate"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !generated || previewQuestions.length === 0}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12px] font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            <AppIcon name="Save" size={15} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FilterSelect label="Syllabus" value={syllabusId} onChange={handleSyllabusChange}>
                {syllabi.map((syllabus) => (
                  <option key={syllabus.id} value={syllabus.id}>
                    {syllabus.label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Class"
                value={className}
                onChange={handleClassChange}
                disabled={catalogLoading || Boolean(catalogError)}
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Subject"
                value={subjectName}
                onChange={handleSubjectChange}
                disabled={!className || catalogLoading || Boolean(catalogError)}
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </FilterSelect>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500">Search Questions</span>
                <div className="relative">
                  <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search loaded questions"
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
              </label>
            </div>
            {(catalogLoading || catalogError) && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-[12px] font-semibold ${
                  catalogError ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-700"
                }`}
              >
                {catalogError || `Loading ${syllabusId.toUpperCase()} syllabus data...`}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <ChapterPicker
              units={chapterUnits}
              chapters={allChapters}
              selectedChapterIds={selectedChapterIds}
              onToggle={toggleChapter}
              onSelectAll={() => {
                const next = allChapters.map((chapter) => chapter.id);
                setSelectedChapterIds(next);
                syncUrl({ chapters: next });
                setGenerated(false);
              }}
              onClearAll={() => {
                setSelectedChapterIds([]);
                syncUrl({ chapters: [] });
                setGenerated(false);
              }}
            />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-[14px] font-bold text-slate-900">Question Types</h2>
                <p className="text-[11px] text-slate-500">Loaded from dynamic configuration</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuestionTypes(QUESTION_TYPES.map((type) => type.id))}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuestionTypes([])}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {QUESTION_TYPES.map((type) => {
                const active = selectedQuestionTypes.includes(type.id);
                return (
                  <button
                    type="button"
                    key={type.id}
                    onClick={() => toggleQuestionType(type.id)}
                    className={`min-h-10 rounded-lg border px-3 py-2 text-left text-[12px] font-bold transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AppIcon name={active ? "CheckCircle2" : "Circle"} size={14} />
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-[14px] font-bold text-slate-900">Generated Questions</h2>
                <p className="text-[11px] text-slate-500">
                  {generated
                    ? `${previewQuestions.length} matching questions - ${totalMarks} marks`
                    : "Run Generate to load matching question bank records"}
                </p>
              </div>
              {generated && previewQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <AppIcon name="Printer" size={14} />
                  Print
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : generated && previewQuestions.length === 0 ? (
              <EmptyState title="No questions found" message="The filters are valid, but the bank has no matching records yet." />
            ) : generated ? (
              <QuestionPreview questions={previewQuestions} />
            ) : (
              <EmptyState title="Ready to generate" message="Choose chapters and question types, then generate the paper." />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="text-[14px] font-bold text-slate-900 mb-3">Selection Summary</h2>
            <Metric label="Total Chapters" value={allChapters.length} />
            <Metric label="Selected Chapters" value={selectedChapterIds.length} />
            <Metric label="Coverage" value={`${coverage}%`} />
            <Metric label="Question Types" value={selectedQuestionTypes.length} />
            <Metric label="Generated Questions" value={previewQuestions.length} />
            <Metric label="Total Marks" value={totalMarks} />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h2 className="text-[14px] font-bold text-slate-900">Paper Settings</h2>
            <TextField label="Paper Title" value={paperTitle} onChange={setPaperTitle} placeholder="English Unit Test" />
            <TextField label="Exam Name" value={examName} onChange={setExamName} placeholder="Mid Term 2026" />
            <TextField label="Time" value={totalTime} onChange={setTotalTime} placeholder="3 Hours" />
            <TextField label="Date" value={date} onChange={setDate} type="date" />
            <label className="space-y-1 block">
              <span className="text-[11px] font-bold text-slate-500">Instructions</span>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-200 p-3 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
              />
            </label>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ChapterPicker({
  units,
  chapters,
  selectedChapterIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  units: BaseUnit[];
  chapters: BaseChapter[];
  selectedChapterIds: string[];
  onToggle: (chapterId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  if (chapters.length === 0) {
    return <EmptyState title="No chapters configured" message="This subject is ready for CSV imports, but no chapter list has been migrated yet." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">Chapters</h2>
          <p className="text-[11px] text-slate-500">Single chapter, multiple chapters, select all or clear all</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClearAll} className="text-[11px] font-bold text-slate-500 hover:text-slate-700">
            Clear All
          </button>
          <button type="button" onClick={onSelectAll} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
            Select All
          </button>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
        {units.map((unit) => {
          const selectedInUnit = unit.chapters.filter((chapter) => selectedChapterIds.includes(chapter.id)).length;
          return (
            <div key={unit.id} className="rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <AppIcon name={unit.type === "review" ? "RotateCcw" : "BookOpen"} size={15} className="text-blue-600" />
                  <span className="text-[12px] font-bold text-slate-800 truncate">{unit.title}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedInUnit}/{unit.chapters.length}
                </span>
              </div>
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {unit.chapters.map((chapter) => {
                  const active = selectedChapterIds.includes(chapter.id);
                  return (
                    <label
                      key={chapter.id}
                      className={`flex items-start gap-2 rounded-md border px-2 py-2 cursor-pointer transition-colors ${
                        active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => onToggle(chapter.id)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold text-slate-800">{chapter.title}</span>
                        <span className="block text-[10px] text-slate-400">{chapter.code}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionPreview({ questions }: { questions: PreviewQuestion[] }) {
  const grouped = QUESTION_TYPES.map((type) => ({
    type,
    questions: questions.filter((question) => question.type === type.id),
  })).filter((group) => group.questions.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.type.id} className="space-y-2">
          <div className="h-9 rounded-lg bg-slate-900 text-white px-3 flex items-center justify-between">
            <span className="text-[12px] font-bold">{group.type.label}</span>
            <span className="text-[11px] font-semibold text-slate-300">{group.questions.length} questions</span>
          </div>
          {group.questions.map((question, index) => (
            <div key={question.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <span className="text-[12px] font-bold text-slate-500">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800" dangerouslySetInnerHTML={{ __html: question.text }} />
                  {question.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                          ({String.fromCharCode(65 + optionIndex)}) {option}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span>{question.marks} marks</span>
                    {question.chapter && <span>{question.chapter}</span>}
                    <span>{getQuestionTypeLabel(question.type)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1 block">
      <span className="text-[11px] font-bold text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[12px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[12px] font-bold text-slate-900">{value}</span>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-40 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6">
      <AppIcon name="Inbox" size={28} className="text-slate-300 mb-2" />
      <p className="text-[13px] font-bold text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">{message}</p>
    </div>
  );
}

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getQuestionText(question: QuestionRow) {
  return question.question_html || question.question || "";
}

function parseOptions(value: unknown): string[] {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((option) => {
        if (typeof option === "string") return option;
        if (option && typeof option === "object") {
          const item = option as { option_text?: string; text?: string; label?: string };
          return item.option_text || item.text || item.label || "";
        }
        return "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}
