import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { normalizeQuestionTypeId, QUESTION_TYPES } from "@/data/question-types";
import customQuestionTypesConfig from "@/data/subject-question-types.json";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import type { SyllabusConfig } from "@/data/syllabus";
import type { BaseChapter, BaseUnit } from "@/components/syllabus/ChapterSelector";

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

export function QuestionPaperGeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [syllabusId, setSyllabusId] = useState(() => normalizeSyllabusId(searchParams.get("syllabus")));
  const [className, setClassName] = useState(() => searchParams.get("class") || "");
  const [subjectName, setSubjectName] = useState(() => searchParams.get("subject") || "");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(() =>
    (searchParams.get("chapters") || "").split(",").map((item) => item.trim()).filter(Boolean),
  );
  const [selectedQuestionType, setSelectedQuestionType] = useState(() => searchParams.get("type") || "");

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const availableQuestionTypes = useMemo(() => {
    try {
      const config = customQuestionTypesConfig as Record<string, Record<string, Record<string, { id: string; label: string }[]>>>;
      if (syllabusId && className && subjectName) {
        const custom = config[syllabusId]?.[className]?.[subjectName];
        if (Array.isArray(custom)) {
          return custom;
        }
      }
    } catch {
      // Ignore
    }
    return QUESTION_TYPES;
  }, [syllabusId, className, subjectName]);

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

  function syncUrl(next: {
    syllabus?: string;
    cls?: string;
    subject?: string;
    chapters?: string[];
    type?: string;
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
    if (next.type !== undefined) {
      if (next.type) params.set("type", next.type);
      else params.delete("type");
    }
    setSearchParams(params, { replace: true });
  }

  function handleSyllabusChange(value: string) {
    const normalized = normalizeSyllabusId(value);
    setSyllabusId(normalized);
    setClassName("");
    setSubjectName("");
    setSelectedChapterIds([]);
    setSelectedQuestionType("");
    setQuestions([]);
    setGenerated(false);
    syncUrl({ syllabus: normalized, cls: "", subject: "", chapters: [], type: "" });
  }

  function handleClassChange(value: string) {
    setClassName(value);
    setSubjectName("");
    setSelectedChapterIds([]);
    setSelectedQuestionType("");
    setQuestions([]);
    setGenerated(false);
    syncUrl({ cls: value, subject: "", chapters: [], type: "" });
  }

  function handleSubjectChange(value: string) {
    setSubjectName(value);
    setSelectedChapterIds([]);
    setSelectedQuestionType("");
    setQuestions([]);
    setGenerated(false);
    syncUrl({ subject: value, chapters: [], type: "" });
  }

  function toggleChapter(chapterId: string) {
    const next = selectedChapterIds.includes(chapterId)
      ? selectedChapterIds.filter((id) => id !== chapterId)
      : [...selectedChapterIds, chapterId];
    setSelectedChapterIds(next);
    setGenerated(false);
    syncUrl({ chapters: next });
  }

  function handleQuestionTypeChange(value: string) {
    setSelectedQuestionType(value);
    setGenerated(false);
    syncUrl({ type: value });
  }

  async function handleGenerate() {
    if (!className || !subjectName) {
      showToast("Select class and subject first.", "error");
      return;
    }
    if (selectedChapterIds.length === 0) {
      showToast("Select at least one chapter.", "error");
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
      if (selectedQuestionType) {
        params.set("type", selectedQuestionType);
        params.set("question_type", selectedQuestionType);
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
        showToast("No matching questions found.", "error");
      } else {
        showToast(`Loaded questions successfully!`, "success");
      }
    } finally {
      setLoading(false);
    }
  }

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

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (selectedQuestionType) {
        const type = normalizeQuestionTypeId(question.questionType || question.question_type || question.type);
        if (type !== selectedQuestionType) return false;
      }
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
      return true;
    });
  }, [questions, selectedChapterIds.length, selectedChapterSet, selectedChapterTitles, selectedQuestionType]);

  const previewQuestions = useMemo<PreviewQuestion[]>(
    () =>
      filteredQuestions.map((question) => ({
        id: question._id || question.id || getQuestionText(question),
        type: normalizeQuestionTypeId(question.questionType || question.question_type || question.type),
        text: getQuestionText(question),
        marks: Number(question.marks || 1),
        chapter: question.chapter_name || question.chapter || "Unknown Chapter",
        options: parseOptions(question.options),
        answer: question.answer,
      })),
    [filteredQuestions],
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between gap-3 print:hidden">
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
          {generated && previewQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
            >
              <AppIcon name="Printer" size={15} />
              Print Paper
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || catalogLoading}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors inline-flex items-center gap-2"
          >
            <AppIcon name={loading ? "Loader2" : "Sparkles"} size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Generating..." : "Generate Paper"}
          </button>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
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

          <FilterSelect
            label="Question Type"
            value={selectedQuestionType}
            onChange={handleQuestionTypeChange}
            disabled={!subjectName}
          >
            <option value="">Select question type</option>
            {availableQuestionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </FilterSelect>
        </div>
        {(catalogLoading || catalogError) && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-[12px] font-semibold ${catalogError ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-700"
              }`}
          >
            {catalogError || `Loading ${syllabusId.toUpperCase()} syllabus data...`}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm print:hidden">
        <ChapterPicker
          units={chapterUnits}
          chapters={allChapters}
          selectedChapterIds={selectedChapterIds}
          onToggle={toggleChapter}
          onSelectAll={() => {
            const next = allChapters.map((chapter) => chapter.id);
            setSelectedChapterIds(next);
            setGenerated(false);
            syncUrl({ chapters: next });
          }}
          onClearAll={() => {
            setSelectedChapterIds([]);
            setGenerated(false);
            syncUrl({ chapters: [] });
          }}
        />
      </section>

      {generated && previewQuestions.length > 0 && (
        <section className="mt-8 print:mt-0">
          <PrintView questions={previewQuestions} />
        </section>
      )}

      {generated && previewQuestions.length === 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm print:hidden">
          <EmptyState title="No questions found" message="Try relaxing your filters or selecting more chapters." />
        </section>
      )}
    </div>
  );
}

function PrintView({ questions }: { questions: PreviewQuestion[] }) {
  const groups: Record<string, PreviewQuestion[]> = {};
  for (const q of questions) {
    const chap = q.chapter || "Uncategorized";
    if (!groups[chap]) groups[chap] = [];
    groups[chap].push(q);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm print:shadow-none print:border-none print:p-0 print:bg-transparent">
      {Object.entries(groups).map(([chapterName, chapterQuestions]) => (
        <div key={chapterName} className="mb-10 page-break-inside-avoid">
          {/* Deep Purple Header */}
          <div
            className="bg-[#2D1B69] text-white py-2 px-4 text-center font-bold text-[14px]"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
          >
            {chapterName}
          </div>

          <div className="mt-0 border border-t-0 border-slate-200">
            {chapterQuestions.map((q, index) => (
              <div
                key={q.id}
                className={`flex border-b border-slate-200 last:border-b-0 py-3 px-3 print:break-inside-avoid ${index % 2 !== 0 ? 'bg-slate-50/50 print:bg-transparent' : ''}`}
              >
                <div className="w-8 pt-0.5 text-[13px] font-bold text-slate-800 shrink-0">
                  {index + 1}.
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[13px] text-slate-800 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: q.text }} />

                  {q.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="text-[12px] text-slate-700 min-w-[120px]">
                          <span className="font-bold mr-1">({String.fromCharCode(65 + optIdx)})</span> {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                      className={`flex items-start gap-2 rounded-md border px-2 py-2 cursor-pointer transition-colors ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"
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
