import { AppIcon } from "shared/ui/AppIcon";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { ChapterSelector } from "@/components/syllabus/ChapterSelector";
import { PTB_CLASS5_GENERAL_SCIENCE, getAllChapters } from "@/data/syllabus/ptb-class5-general-science";

export function SyllabusClass5ScienceDemoPage() {
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  const allChapters = getAllChapters();
  const selectedChapterDetails = allChapters.filter((ch) => selectedChapters.includes(ch.id));

  return (
    <SchoolShell eyebrow="Question Papers" title="Class 5 General Science - Chapter Selection">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/question-papers"
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chapter Selection</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">PTB → Class 5 → General Science</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <ChapterSelector
                units={PTB_CLASS5_GENERAL_SCIENCE}
                selectedChapters={selectedChapters}
                onSelectionChange={setSelectedChapters}
                title="PTB Class 5 General Science Syllabus"
                subtitle="Select chapters to include in the question paper"
              />
            </div>
          </div>

          <div className="space-y-4">
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
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {selectedChapterDetails.map((ch) => (
                    <div key={ch.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{ch.code}</span>
                        <span className="text-[11px] text-slate-700 flex-1 truncate">{ch.title}</span>
                        <button
                          onClick={() => setSelectedChapters((prev) => prev.filter((id) => id !== ch.id))}
                          className="h-5 w-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <AppIcon name="X" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Statistics</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Total Chapters</span>
                  <span className="font-bold text-slate-900">{PTB_CLASS5_GENERAL_SCIENCE.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Total Topics</span>
                  <span className="font-bold text-slate-900">{allChapters.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Selected</span>
                  <span className="font-bold text-blue-600">{selectedChapters.length}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Coverage</span>
                  <span className="font-bold text-emerald-600">
                    {allChapters.length > 0 ? Math.round((selectedChapters.length / allChapters.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
