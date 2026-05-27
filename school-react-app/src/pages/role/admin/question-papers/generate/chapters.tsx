import { AppIcon } from "shared/ui/AppIcon";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ChapterSelector } from "@/components/syllabus/ChapterSelector";
import { getSyllabusData } from "@/data/syllabus/registry";

/**
 * Chapters Selection Page
 * 
 * Dynamically loads syllabus data from the registry based on
 * URL params: ?syllabus=ptb&class=ONE&subject=English
 * 
 * Shows ChapterSelector when data exists, Coming Soon when it doesn't.
 */

export function ChaptersSelectionPage() {
  const [searchParams] = useSearchParams();
  const syllabus = searchParams.get("syllabus") || "ptb";
  const className = searchParams.get("class") || "";
  const subject = searchParams.get("subject") || "";
  const syllabusLabel = syllabus.toUpperCase().replace("-", " ");

  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  const units = getSyllabusData(syllabus, className, subject);
  const allTopics = units ? units.flatMap((u) => u.chapters) : [];
  const selectedDetails = allTopics.filter((ch) => selectedChapters.includes(ch.id));

  return (
    <SchoolShell eyebrow="Question Papers" title="Chapter Selection">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/question-papers/generate/subjects?syllabus=${syllabus}&class=${encodeURIComponent(className)}`}
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chapter Selection</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              <span className="font-bold text-blue-600">{syllabusLabel}</span>
              <span className="mx-1.5 text-slate-300">›</span>
              <span className="font-bold text-slate-700">{className}</span>
              <span className="mx-1.5 text-slate-300">›</span>
              <span className="font-bold text-slate-700">{subject}</span>
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 flex-wrap">
          <Link to="/admin/question-papers" className="hover:text-blue-600 transition-colors">Question Papers</Link>
          <AppIcon name="ChevronRight" size={12} />
          <Link to="/admin/question-papers/generate/syllabus" className="hover:text-blue-600 transition-colors">Syllabus</Link>
          <AppIcon name="ChevronRight" size={12} />
          <Link to={`/admin/question-papers/generate/classes?syllabus=${syllabus}`} className="hover:text-blue-600 transition-colors">{syllabusLabel}</Link>
          <AppIcon name="ChevronRight" size={12} />
          <Link to={`/admin/question-papers/generate/subjects?syllabus=${syllabus}&class=${encodeURIComponent(className)}`} className="hover:text-blue-600 transition-colors">{className}</Link>
          <AppIcon name="ChevronRight" size={12} />
          <span className="text-blue-600">{subject}</span>
        </div>

        {/* ── No data yet: Coming Soon ───────────────────────────── */}
        {!units && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
              <AppIcon name="Clock" size={32} className="text-amber-500" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-900 mb-2">Coming Soon</h2>
            <p className="text-[13px] text-slate-500 max-w-sm leading-relaxed">
              The syllabus for <span className="font-bold text-slate-700">{subject}</span> — {syllabusLabel} {className} is not yet available.
              It will be added shortly.
            </p>
            <Link
              to={`/admin/question-papers/generate/subjects?syllabus=${syllabus}&class=${encodeURIComponent(className)}`}
              className="mt-6 h-9 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <AppIcon name="ArrowLeft" size={14} />
              Back to Subjects
            </Link>
          </div>
        )}

        {/* ── Syllabus data available ────────────────────────────── */}
        {units && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Chapter Selector */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <ChapterSelector
                  units={units}
                  selectedChapters={selectedChapters}
                  onSelectionChange={setSelectedChapters}
                  title={`${subject} — ${syllabusLabel} ${className}`}
                  subtitle="Select chapters to include in the question paper"
                />
              </div>
            </div>

            {/* Right: Summary + Actions */}
            <div className="space-y-4">

              {/* Selected Summary */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <AppIcon name="CheckCircle2" size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900">Selected Chapters</h3>
                    <p className="text-[10px] text-slate-400">{selectedChapters.length} chapters</p>
                  </div>
                </div>

                {selectedChapters.length === 0 ? (
                  <div className="text-center py-8">
                    <AppIcon name="BookOpen" size={32} className="text-slate-200 mb-2 mx-auto" />
                    <p className="text-[11px] text-slate-400">No chapters selected</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                    {selectedDetails.map((ch) => (
                      <div key={ch.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                            {ch.code}
                          </span>
                          <span className="text-[11px] text-slate-700 flex-1 truncate">{ch.title}</span>
                          <button
                            onClick={() => setSelectedChapters((prev) => prev.filter((id) => id !== ch.id))}
                            className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <AppIcon name="X" size={12} />
                          </button>
                        </div>
                        {(ch as any).titleUrdu && (
                          <div className="text-[10px] text-slate-400 pl-8 pr-6" dir="rtl">{(ch as any).titleUrdu}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedChapters.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)] space-y-2">
                  <button className="w-full h-9 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <AppIcon name="FileText" size={14} />
                    Generate Paper
                  </button>
                  <button className="w-full h-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[12px] font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <AppIcon name="Save" size={14} />
                    Save Selection
                  </button>
                </div>
              )}

              {/* Statistics */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Statistics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total Groups</span>
                    <span className="font-bold text-slate-900">{units.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total Topics</span>
                    <span className="font-bold text-slate-900">{allTopics.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Selected</span>
                    <span className="font-bold text-blue-600">{selectedChapters.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Coverage</span>
                    <span className="font-bold text-emerald-600">
                      {allTopics.length > 0
                        ? Math.round((selectedChapters.length / allTopics.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </SchoolShell>
  );
}
