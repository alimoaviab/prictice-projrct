import { useState, useMemo } from "react";
import { AppIcon } from "shared/ui/AppIcon";

// ─── Types ──────────────────────────────────────────────────────────────────
interface MCQPreview {
  id: string;
  question: string;
  options: string[];
  type: string;
}

const QUESTION_TYPES = [
  "Multiple Choice Questions",
  "Fill in the blanks",
  "True False",
  "Match the columns",
  "Short Questions",
  "Long Questions",
  "Grammar",
  "Essays",
  "Applications",
  "Stories",
  "Translation",
  "Missing Letters",
  "Correct Spelling",
  "Word Meaning",
  "Singular Plural",
  "Genders",
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard", "Mixed"];
const MEDIUMS = ["English", "Urdu", "Both"];
const PAPER_PATTERNS = ["Board Pattern", "Test Pattern", "Custom"];

const SAMPLE_CHAPTERS = [
  "UNIT 1: Greetings and Introduction",
  "UNIT 2: My Family",
  "UNIT 3: Our School",
  "UNIT 4: Health and Hygiene",
  "UNIT 5: Our Country",
  "UNIT 6: Transport",
  "UNIT 7: Festivals",
  "UNIT 8: Animals and Birds",
  "UNIT 9: Weather",
  "UNIT 10: Sports and Games",
  "UNIT 11: Good Manners",
];

const SAMPLE_MCQS: MCQPreview[] = [
  { id: "1", question: "What is the capital of Pakistan?", options: ["Lahore", "Karachi", "Islamabad", "Peshawar"], type: "MCQ" },
  { id: "2", question: "Which planet is closest to the Sun?", options: ["Venus", "Mercury", "Earth", "Mars"], type: "MCQ" },
  { id: "3", question: "The synonym of 'Happy' is:", options: ["Sad", "Joyful", "Angry", "Tired"], type: "MCQ" },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export function SmartPaperGenerator() {
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState(QUESTION_TYPES[0]);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [medium, setMedium] = useState("English");
  const [paperPattern, setPaperPattern] = useState("Board Pattern");
  const [syllabusMode, setSyllabusMode] = useState<"full" | "smart">("full");
  const [requiredQuestions, setRequiredQuestions] = useState("10");
  const [marksPerQuestion, setMarksPerQuestion] = useState("1");
  const [ignoreQuestions, setIgnoreQuestions] = useState("0");
  const [blankLines, setBlankLines] = useState("2");
  const [questionsPerLine, setQuestionsPerLine] = useState("1");
  const [longQuestionParts, setLongQuestionParts] = useState("3");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewQuestions] = useState<MCQPreview[]>(SAMPLE_MCQS);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_CHAPTERS;
    return SAMPLE_CHAPTERS.filter(ch =>
      ch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const selectAll = () => setSelectedChapters([...SAMPLE_CHAPTERS]);
  const clearAll = () => setSelectedChapters([]);

  return (
    <div className="min-h-screen">

        {/* ── Top Header Banner ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-6 mb-6 shadow-xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2MmgxMnptMC00VjI0SDI0djJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <AppIcon name="Sparkles" size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">THE LEGEND SCHOOL & ACADEMY</h1>
                  <p className="text-[11px] text-white/70 font-medium">Advanced Smart Paper Generator</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Smart Generator
              </span>
              <div className="flex items-center gap-2">
                <button className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
                  <AppIcon name="Bell" size={16} />
                </button>
                <button className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-all">
                  <AppIcon name="Moon" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Grid: Generator + Preview ─────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Main Generator Panel ───────────────────────── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Subject Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <AppIcon name="BookOpen" size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">Select Your Questions Here</h2>
                  <p className="text-[12px] text-slate-500">ONE — English • PTB Syllabus</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                    {selectedChapters.length} Selected
                  </span>
                </div>
              </div>

              {/* Syllabus Mode Toggle */}
              <div className="flex items-center gap-3 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  onClick={() => setSyllabusMode("full")}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    syllabusMode === "full"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Full Syllabus
                </button>
                <button
                  onClick={() => setSyllabusMode("smart")}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                    syllabusMode === "smart"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <AppIcon name="Zap" size={12} />
                    Smart Syllabus
                  </span>
                </button>
              </div>
            </div>

            {/* Chapter Selection Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                  <AppIcon name="List" size={16} className="text-indigo-500" />
                  Syllabus Chapters
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={selectAll} className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors">
                    Select All
                  </button>
                  <button onClick={clearAll} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    Clear All
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapters..."
                  className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                />
              </div>

              {/* Chapter List */}
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {filteredChapters.map((chapter) => (
                  <label
                    key={chapter}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${
                      selectedChapters.includes(chapter)
                        ? "bg-indigo-50 border border-indigo-200"
                        : "bg-slate-50/50 border border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter)}
                      onChange={() => toggleChapter(chapter)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 transition-all"
                    />
                    <span className={`text-[12px] font-medium transition-colors ${
                      selectedChapters.includes(chapter) ? "text-indigo-800" : "text-slate-700 group-hover:text-slate-900"
                    }`}>
                      {chapter}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dropdowns & Filters Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2 mb-4">
                <AppIcon name="SlidersHorizontal" size={16} className="text-indigo-500" />
                Smart Filters
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SelectField label="Question Type" value={questionType} onChange={setQuestionType} options={QUESTION_TYPES} />
                <SelectField label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTY_LEVELS} />
                <SelectField label="Medium" value={medium} onChange={setMedium} options={MEDIUMS} />
                <SelectField label="Paper Pattern" value={paperPattern} onChange={setPaperPattern} options={PAPER_PATTERNS} />
              </div>
            </div>

            {/* Input Fields Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2 mb-4">
                <AppIcon name="Settings2" size={16} className="text-indigo-500" />
                Paper Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InputField label="Required Questions" value={requiredQuestions} onChange={setRequiredQuestions} />
                <InputField label="Marks Per Question" value={marksPerQuestion} onChange={setMarksPerQuestion} />
                <InputField label="Ignore Questions" value={ignoreQuestions} onChange={setIgnoreQuestions} />
                <InputField label="Blank Lines" value={blankLines} onChange={setBlankLines} />
                <InputField label="Questions Per Line" value={questionsPerLine} onChange={setQuestionsPerLine} />
                <InputField label="Long Question Parts" value={longQuestionParts} onChange={setLongQuestionParts} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[12px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                <AppIcon name="Shuffle" size={15} />
                Random Select
              </button>
              <button className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[12px] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                <AppIcon name="Plus" size={15} />
                Add Questions
              </button>
              <button className="h-11 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[12px] font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2">
                <AppIcon name="FileText" size={15} />
                Generate Paper
              </button>
            </div>

          </div>

          {/* ── Right: Live Preview Panel ────────────────────────── */}
          <div className="space-y-5">

            {/* Preview Header */}
            <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-white flex items-center gap-2">
                  <AppIcon name="Eye" size={16} className="text-indigo-400" />
                  Live Preview
                </h3>
                <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                  LIVE
                </span>
              </div>

              {/* MCQ Preview Cards */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {previewQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="h-6 w-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-[12px] text-slate-200 font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-9">
                      {q.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50">
                          <span className="h-4 w-4 rounded-full bg-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-300">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-[10px] text-slate-300">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {previewQuestions.length === 0 && (
                  <div className="text-center py-12">
                    <AppIcon name="FileQuestion" size={40} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-[11px] text-slate-500">Select chapters and add questions to see preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Progress</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500">Questions Added</span>
                    <span className="font-bold text-indigo-600">{previewQuestions.length}/{requiredQuestions}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${Math.min((previewQuestions.length / parseInt(requiredQuestions || "10")) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[18px] font-bold text-slate-900">{selectedChapters.length}</p>
                    <p className="text-[9px] text-slate-500 font-medium">Chapters</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[18px] font-bold text-indigo-600">{parseInt(requiredQuestions || "0") * parseInt(marksPerQuestion || "1")}</p>
                    <p className="text-[9px] text-slate-500 font-medium">Total Marks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Balance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Difficulty Balance</h4>
              <div className="space-y-2">
                <DifficultyBar label="Easy" percent={30} color="from-emerald-400 to-emerald-500" />
                <DifficultyBar label="Medium" percent={50} color="from-amber-400 to-amber-500" />
                <DifficultyBar label="Hard" percent={20} color="from-red-400 to-red-500" />
              </div>
            </div>

          </div>
        </div>
      </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function InputField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
      />
    </div>
  );
}

function DifficultyBar({ label, percent, color }: {
  label: string;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-500 font-bold">{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}
