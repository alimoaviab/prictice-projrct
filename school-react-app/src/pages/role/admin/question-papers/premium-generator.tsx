import { AppIcon } from "shared/ui/AppIcon";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Premium Paper Generator Page
 * 
 * Professional school paper-making software with modern UI/UX
 */

// Mock data - replace with actual data
const MOCK_SUBJECT = {
  id: "english-class2",
  title: "English",
  class: "Class 2",
  board: "PTB",
  thumbnail: "📚",
  units: [
    { id: "u1", code: "UNIT 1", title: "Time to Recall", chapters: 12 },
    { id: "u2", code: "UNIT 2", title: "My Family and I", chapters: 8 },
    { id: "r1", code: "Review 1", title: "Review 1", chapters: 5 },
    { id: "u3", code: "UNIT 3", title: "Fun with Friends", chapters: 10 },
    { id: "u4", code: "UNIT 4", title: "Animals Around Us", chapters: 9 },
    { id: "r2", code: "Review 2", title: "Review 2", chapters: 5 },
    { id: "u5", code: "UNIT 5", title: "Sharing is Caring", chapters: 11 },
    { id: "u6", code: "UNIT 6", title: "Nature's Beauty", chapters: 7 },
  ],
};

const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Tick Correct Spelling",
  "Tick Correct Grammar",
  "Fill In The Blanks",
  "True False",
  "Match Columns",
  "Question Answers",
  "Letters",
  "Applications",
  "Stories",
  "Essays",
  "Missing Letters",
  "Singular Plural",
  "Translate Into Urdu Paragraphs",
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard", "Mixed"];
const MEDIUM_OPTIONS = ["English", "Urdu", "Both"];

// Mock questions database
const MOCK_QUESTIONS = Array.from({ length: 50 }, (_, i) => ({
  id: `q${i + 1}`,
  text: `Sample question ${i + 1}: What is the meaning of this word?`,
  type: QUESTION_TYPES[i % QUESTION_TYPES.length],
  chapter: MOCK_SUBJECT.units[i % MOCK_SUBJECT.units.length].code,
  marks: [1, 2, 3, 5][i % 4],
  difficulty: DIFFICULTY_LEVELS[i % 3],
  unitId: MOCK_SUBJECT.units[i % MOCK_SUBJECT.units.length].id,
}));

interface CustomDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function CustomDropdown({ value, options, onChange, placeholder }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-left text-sm text-slate-700 hover:border-purple-300 hover:shadow-sm transition-all flex items-center justify-between group"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value || placeholder || "Select..."}
        </span>
        <AppIcon
          name="ChevronDown"
          size={16}
          className={`text-slate-400 group-hover:text-purple-500 transition-all ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full left-0 right-0 mt-2 z-20 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="p-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                {options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl text-left text-sm transition-all ${
                      value === option
                        ? "bg-purple-50 text-purple-700 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PremiumPaperGeneratorPage() {
  // State management
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [medium, setMedium] = useState("");
  const [smartSyllabus, setSmartSyllabus] = useState(false);
  const [fullSyllabus, setFullSyllabus] = useState(false);
  const [requiredQuestions, setRequiredQuestions] = useState("10");
  const [eachQuestionMarks, setEachQuestionMarks] = useState("2");
  const [ignoreQuestions, setIgnoreQuestions] = useState("0");
  const [blankLines, setBlankLines] = useState("2");
  const [twoQuestionsPerLine, setTwoQuestionsPerLine] = useState(false);
  const [longQuestionParts, setLongQuestionParts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return MOCK_QUESTIONS.filter((q) => {
      if (selectedUnits.length > 0 && !selectedUnits.includes(q.unitId)) return false;
      if (questionType && q.type !== questionType) return false;
      if (difficulty && difficulty !== "Mixed" && q.difficulty !== difficulty) return false;
      if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [selectedUnits, questionType, difficulty, searchQuery]);

  // Calculate stats
  const totalMarks = selectedQuestions.reduce((sum, qId) => {
    const q = MOCK_QUESTIONS.find((mq) => mq.id === qId);
    return sum + (q?.marks || 0);
  }, 0);

  const estimatedTime = Math.ceil(totalMarks * 1.5); // 1.5 minutes per mark

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const toggleQuestion = (qId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleRandomSelect = () => {
    const count = parseInt(requiredQuestions) || 10;
    const randomQuestions = filteredQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((q) => q.id);
    setSelectedQuestions(randomQuestions);
  };

  const handleAddQuestions = () => {
    const count = parseInt(requiredQuestions) || 10;
    const newQuestions = filteredQuestions
      .filter((q) => !selectedQuestions.includes(q.id))
      .slice(0, count)
      .map((q) => q.id);
    setSelectedQuestions([...selectedQuestions, ...newQuestions]);
  };

  return (
    <SchoolShell eyebrow="Question Papers" title="Premium Paper Generator">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/question-papers"
            className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 hover:border-purple-200 transition-all"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paper Generator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Create professional question papers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-6">
            {/* Top Area: Subject Info + Chapter Selection */}
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Subject Thumbnail */}
                  <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-5xl shadow-lg">
                      {MOCK_SUBJECT.thumbnail}
                    </div>
                  </div>

                  {/* Subject Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                        {MOCK_SUBJECT.board}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                        {MOCK_SUBJECT.class}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{MOCK_SUBJECT.title}</h2>
                    <p className="text-sm text-slate-500">Select chapters to include in your paper</p>
                  </div>
                </div>

                {/* Chapter Selection Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MOCK_SUBJECT.units.map((unit) => (
                    <motion.button
                      key={unit.id}
                      onClick={() => toggleUnit(unit.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedUnits.includes(unit.id)
                          ? "bg-purple-50 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : "bg-white border-slate-200 hover:border-purple-200 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            selectedUnits.includes(unit.id)
                              ? "bg-purple-500 border-purple-500"
                              : "bg-white border-slate-300"
                          }`}
                        >
                          {selectedUnits.includes(unit.id) && (
                            <AppIcon name="Check" size={14} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-purple-600">{unit.code}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{unit.chapters} topics</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 truncate">{unit.title}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AppIcon name="Filter" size={20} className="text-purple-500" />
                Filters & Settings
              </h3>

              {/* Dropdowns Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Question Type</label>
                  <CustomDropdown
                    value={questionType}
                    options={QUESTION_TYPES}
                    onChange={setQuestionType}
                    placeholder="Select type..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Difficulty</label>
                  <CustomDropdown
                    value={difficulty}
                    options={DIFFICULTY_LEVELS}
                    onChange={setDifficulty}
                    placeholder="Select difficulty..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Medium</label>
                  <CustomDropdown
                    value={medium}
                    options={MEDIUM_OPTIONS}
                    onChange={setMedium}
                    placeholder="Select medium..."
                  />
                </div>
              </div>

              {/* Syllabus Options */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSmartSyllabus(!smartSyllabus)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    smartSyllabus
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AppIcon name="Sparkles" size={14} />
                    Smart Syllabus
                  </span>
                </button>
                <button
                  onClick={() => setFullSyllabus(!fullSyllabus)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    fullSyllabus
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AppIcon name="BookOpen" size={14} />
                    Full Syllabus
                  </span>
                </button>
              </div>

              {/* Input Fields Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Required Questions</label>
                  <input
                    type="number"
                    value={requiredQuestions}
                    onChange={(e) => setRequiredQuestions(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Each Question Marks</label>
                  <input
                    type="number"
                    value={eachQuestionMarks}
                    onChange={(e) => setEachQuestionMarks(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Ignore Questions</label>
                  <input
                    type="number"
                    value={ignoreQuestions}
                    onChange={(e) => setIgnoreQuestions(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Blank Lines</label>
                  <input
                    type="number"
                    value={blankLines}
                    onChange={(e) => setBlankLines(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      twoQuestionsPerLine
                        ? "bg-purple-500 border-purple-500"
                        : "bg-white border-slate-300 group-hover:border-purple-300"
                    }`}
                    onClick={() => setTwoQuestionsPerLine(!twoQuestionsPerLine)}
                  >
                    {twoQuestionsPerLine && <AppIcon name="Check" size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-700">2 Questions Per Line</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div
                    className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      longQuestionParts
                        ? "bg-purple-500 border-purple-500"
                        : "bg-white border-slate-300 group-hover:border-purple-300"
                    }`}
                    onClick={() => setLongQuestionParts(!longQuestionParts)}
                  >
                    {longQuestionParts && <AppIcon name="Check" size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-700">Long Question Parts</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSearchQuery("")}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <AppIcon name="Search" size={16} />
                  SEARCH
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRandomSelect}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <AppIcon name="Shuffle" size={16} />
                  RANDOM SELECT
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddQuestions}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <AppIcon name="Plus" size={16} />
                  ADD QUESTIONS
                </motion.button>
              </div>
            </div>

            {/* Questions Area */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AppIcon name="FileText" size={20} className="text-purple-500" />
                  Available Questions
                  <span className="text-sm font-normal text-slate-400">({filteredQuestions.length})</span>
                </h3>

                {/* Search Input */}
                <div className="relative w-64">
                  <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>

              {/* Questions List */}
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
                              {q.chapter}
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

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all">
                            <AppIcon name="Edit2" size={14} />
                          </button>
                          <button className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all">
                            <AppIcon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Side Panel - Sticky */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <AppIcon name="FileText" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Paper Summary</h3>
                    <p className="text-xs text-white/70">Live preview</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">
                      {selectedQuestions.length}
                    </div>
                    <div className="text-sm text-white/80">Selected Questions</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">{totalMarks}</div>
                    <div className="text-sm text-white/80">Total Marks</div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">{estimatedTime} min</div>
                    <div className="text-sm text-white/80">Estimated Time</div>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AppIcon name="Sparkles" size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900">AI Smart Suggestions</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-xs text-emerald-900 font-medium mb-1">Balance Difficulty</p>
                    <p className="text-xs text-emerald-700">Add 2 more easy questions for better balance</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs text-blue-900 font-medium mb-1">Coverage Tip</p>
                    <p className="text-xs text-blue-700">Unit 3 has no questions selected</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-amber-900 font-medium mb-1">Time Management</p>
                    <p className="text-xs text-amber-700">Paper duration is optimal for this grade</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={selectedQuestions.length === 0}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AppIcon name="FileDown" size={16} />
                  Export PDF
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={selectedQuestions.length === 0}
                  className="w-full h-11 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AppIcon name="Printer" size={16} />
                  Print
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-11 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-emerald-300 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  <AppIcon name="Save" size={16} />
                  Save Draft
                </motion.button>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Stats</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Units Selected</span>
                    <span className="font-bold text-slate-900">{selectedUnits.length}/{MOCK_SUBJECT.units.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Questions Pool</span>
                    <span className="font-bold text-slate-900">{filteredQuestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Avg. Marks/Q</span>
                    <span className="font-bold text-slate-900">
                      {selectedQuestions.length > 0 ? (totalMarks / selectedQuestions.length).toFixed(1) : "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Paper Status</span>
                    <span className={`font-bold ${selectedQuestions.length > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {selectedQuestions.length > 0 ? "Ready" : "Draft"}
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
