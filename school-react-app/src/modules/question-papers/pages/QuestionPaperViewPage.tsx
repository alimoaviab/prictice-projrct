import { AppIcon } from "shared/ui/AppIcon";
/**
 * Question Paper View — Shows a saved paper with print and edit options.
 * NO page reloads.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import type { QuestionPaper, PaperQuestion } from "../types/questionPaper.types";
import { getQuestionTypeLabel, QUESTION_TYPES } from "@/data/question-types";

export function QuestionPaperViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schoolName } = useSchoolBranding();
  const { state, run } = useSafeAsync<QuestionPaper>();
  const { state: settingsState, run: runSettings } = useSafeAsync<any>();

  useEffect(() => {
    if (!id) return;
    void run(async () => {
      const r = await serviceRequest<any>(`/api/question-papers/${id}`);
      if (!r.ok) throw new Error("Paper not found");
      return r.data;
    });
    void runSettings(async () => {
      const r = await serviceRequest<any>("/api/settings");
      return r.ok ? r.data : null;
    }).catch(() => {});
  }, [id, run, runSettings]);

  const paper = state.data;
  const resolvedSchoolName = settingsState.data?.profile?.school_name || schoolName || "School Name";
  const isLoading = state.status === "loading" || state.status === "idle";

  const questions: PaperQuestion[] = useMemo(() => {
    if (!paper) return [];
    const raw = (paper as any).questions;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw) {
      try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {/* */}
    }
    return [];
  }, [paper]);

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const sections = useMemo(() => {
    const configured = QUESTION_TYPES.map((type) => ({
      id: type.id,
      title: type.label,
      questions: questions.filter((question) => question.type === type.id),
    })).filter((section) => section.questions.length > 0);
    const known = new Set(QUESTION_TYPES.map((type) => type.id));
    const unknownTypes = [...new Set(questions.map((question) => question.type).filter((type) => !known.has(type)))];
    const unknown = unknownTypes.map((type) => ({
      id: type,
      title: getQuestionTypeLabel(type),
      questions: questions.filter((question) => question.type === type),
    }));
    let startIdx = 0;
    return [...configured, ...unknown].map((section) => {
      const row = { ...section, startIdx };
      startIdx += section.questions.length;
      return row;
    });
  }, [questions]);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-sm text-slate-500">Paper not found.</p>
        <Link to="/admin/question-papers" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">Back to papers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link to="/admin/question-papers" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all group">
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Papers
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5">
            <AppIcon name="Printer" size={14} />
            Print
          </button>
          <button onClick={() => navigate(`/admin/question-papers/${id}/edit`)} className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5">
            <AppIcon name="Pencil" size={14} />
            Edit Paper
          </button>
        </div>
      </div>

      {/* Paper Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <div className="p-8 md:p-12 print:p-6">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-widest text-slate-900">{resolvedSchoolName}</h1>
            <p className="text-base font-bold text-slate-700 mt-1">{paper.title}</p>

            <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
              {paper.class_name && <span><strong>Class:</strong> {paper.class_name}</span>}
              {paper.subject_name && <span><strong>Subject:</strong> {paper.subject_name}</span>}
              {paper.teacher_name && <span><strong>Teacher:</strong> {paper.teacher_name}</span>}
              {paper.date && <span><strong>Date:</strong> {new Date(paper.date).toLocaleDateString()}</span>}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
              <span><strong>Total Marks:</strong> {totalMarks}</span>
              <span><strong>Total Questions:</strong> {questions.length}</span>
            </div>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <PaperSection
              key={section.id}
              title={section.title}
              marks={section.questions.reduce((s, q) => s + (q.marks || 0), 0)}
              questions={section.questions}
              startIdx={section.startIdx}
              showOptions={section.id === "mcq"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PaperSection({ title, marks, questions, startIdx, showOptions }: {
  title: string; marks: number; questions: PaperQuestion[]; startIdx: number; showOptions?: boolean
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between border-b border-slate-300 pb-1 mb-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h2>
        <span className="text-[10px] font-bold text-slate-500">({marks} Marks)</span>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id || i} className="text-sm text-slate-800">
            <p className="font-medium leading-relaxed">
              <strong>Q{startIdx + i + 1}.</strong> {q.question}
              <span className="text-slate-400 ml-2 text-xs">({q.marks} Marks)</span>
            </p>
            {showOptions && q.options && q.options.length > 0 && (
              <div className="ml-6 mt-1.5 grid grid-cols-2 gap-1">
                {q.options.map((opt, oi) => <p key={oi} className="text-xs text-slate-600">({String.fromCharCode(97 + oi)}) {opt}</p>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
