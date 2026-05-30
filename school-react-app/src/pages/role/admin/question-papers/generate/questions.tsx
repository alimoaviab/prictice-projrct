import { AppIcon } from "shared/ui/AppIcon";
import { useState, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { motion } from "framer-motion";
import { PTB_INTER2_BIOLOGY_COMPLETE_QUESTIONS } from "@/data/question-bank/ptb-inter2-biology-complete";

/**
 * Questions Selection Page
 * 
 * Shows questions from selected chapters
 * User can select questions to build their paper
 */

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  marks: number;
  chapterId: string;
  chapterTitle: string;
}

const QUESTIONS_DATA: Question[] = PTB_INTER2_BIOLOGY_COMPLETE_QUESTIONS;

export function QuestionsSelectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const syllabus = searchParams.get("syllabus") || "ptb";
  const className = searchParams.get("class") || "";
  const subject = searchParams.get("subject") || "";
  const chaptersParam = searchParams.get("chapters") || "";
  const selectedChaptersList = chaptersParam ? chaptersParam.split(",") : [];

  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");

  // All questions from the data
  const allQuestions = useMemo(() => {
    // If no chapters selected, show all questions; otherwise filter by selected chapters
    if (!selectedChaptersList || selectedChaptersList.length === 0) return QUESTIONS_DATA;
    return QUESTIONS_DATA.filter((q) => selectedChaptersList.includes(q.chapterId));
  }, [selectedChaptersList]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType && (q.type || "").toString().toLowerCase() !== filterType) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [allQuestions, searchQuery, filterType, filterDifficulty]);

  const totalMarks = selectedQuestions.reduce((sum, qId) => {
    const q = allQuestions.find((mq) => mq.id === qId);
    return sum + (q?.marks || 0);
  }, 0);

  const toggleQuestion = (qId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleGeneratePaper = () => {
    // Navigate to paper preview or save
    alert(`Paper generated with ${selectedQuestions.length} questions (${totalMarks} marks)`);
  };

  // Normalize types to lowercase so UI filter values match regardless of casing in data
  const questionTypes = [...new Set(allQuestions.map((q) => (q.type || "").toString().toLowerCase()))];
  const difficulties = ["Easy", "Medium", "Hard"];

  return (
    <SchoolShell eyebrow="Question Papers" title="Select Questions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Questions</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              <span className="font-bold text-blue-600">{syllabus.toUpperCase()}</span>
              <span className="mx-1.5 text-slate-300">›</span>
              <span className="font-bold text-slate-700">{className}</span>
              <span className="mx-1.5 text-slate-300">›</span>
              <span className="font-bold text-slate-700">{subject}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AppIcon name="Filter" size={18} className="text-purple-500" />
                Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 mb-2">Search Questions</label>
                  <div className="relative">
                    <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                    />
                  </div>
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Question Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  >
                    <option value="">All Types</option>
                    {questionTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Difficulty</label>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  >
                    <option value="">All Levels</option>
                    {difficulties.map((diff) => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>

                {/* Quick Actions */}
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("");
                      setFilterDifficulty("");
                    }}
                    className="h-10 px-4 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AppIcon name="FileText" size={18} className="text-purple-500" />
                  Available Questions
                  <span className="text-xs font-normal text-slate-400">({filteredQuestions.length})</span>
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedQuestions(filteredQuestions.map((q) => q.id))}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => setSelectedQuestions([])}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <AppIcon name="FileQuestion" size={48} className="text-slate-200 mb-3 mx-auto" />
                    <p className="text-sm text-slate-400">No questions found</p>
                    <p className="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  filteredQuestions.map((q) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedQuestions.includes(q.id)
                          ? "bg-purple-50 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : "bg-white border-slate-200 hover:border-purple-200 hover:shadow-md"
                      }`}
                      onClick={() => toggleQuestion(q.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            selectedQuestions.includes(q.id)
                              ? "bg-purple-500 border-purple-500"
                              : "bg-white border-slate-300"
                          }`}
                        >
                          {selectedQuestions.includes(q.id) && (
                            <AppIcon name="Check" size={12} className="text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-900 mb-2">{q.text}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                              {q.chapterTitle}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
                              {q.marks} marks
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                q.difficulty === "Easy"
                                  ? "bg-green-50 text-green-700"
                                  : q.difficulty === "Medium"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {q.difficulty}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-xs">
                              {q.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl p-5 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AppIcon name="FileText" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Paper Summary</h3>
                    <p className="text-xs text-white/70">Live preview</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-2xl font-bold mb-1">
                      {selectedQuestions.length}
                    </div>
                    <div className="text-xs text-white/80">Selected Questions</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-2xl font-bold mb-1">{totalMarks}</div>
                    <div className="text-xs text-white/80">Total Marks</div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-2xl font-bold mb-1">{Math.ceil(totalMarks * 1.5)} min</div>
                    <div className="text-xs text-white/80">Estimated Time</div>
                  </div>
                </div>
              </div>

              {/* Selected Chapters Info */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Selected Chapters
                </h4>
                <div className="space-y-2">
                  {selectedChaptersList.map((chapter, idx) => (
                    <div key={idx} className="px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                      <span className="text-xs text-blue-700 font-medium">{chapter}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGeneratePaper}
                  disabled={selectedQuestions.length === 0}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AppIcon name="FileDown" size={16} />
                  Generate Paper
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={selectedQuestions.length === 0}
                  className="w-full h-11 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AppIcon name="Save" size={16} />
                  Save Draft
                </motion.button>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Total Questions</span>
                    <span className="font-bold text-slate-900">{allQuestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Filtered</span>
                    <span className="font-bold text-slate-900">{filteredQuestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Selected</span>
                    <span className="font-bold text-blue-600">{selectedQuestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Avg. Marks/Q</span>
                    <span className="font-bold text-slate-900">
                      {selectedQuestions.length > 0 ? (totalMarks / selectedQuestions.length).toFixed(1) : "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
