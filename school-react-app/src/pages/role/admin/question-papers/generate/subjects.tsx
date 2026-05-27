import { AppIcon } from "shared/ui/AppIcon";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";

/**
 * Subjects / Books Selection Page
 * 
 * Shows subjects for selected syllabus + class with book cover images.
 * Clean white EduPlexo design.
 */

// ─── Class-wise subjects data ────────────────────────────────────────────

const subjectsByClass: Record<string, string[]> = {
  // PTB > ONE (Class 1)
  "ONE": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  
  // PTB > TWO (Class 2)
  "TWO": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  
  // PTB > THREE (Class 3)
  "THREE": ["English", "General Knowledge", "Mathematics", "اسلامیات", "اُردو"],
  
  // PTB > FOUR (Class 4)
  "FOUR": ["English", "General Science", "Social Studies", "Mathematics", "اسلامیات", "اُردو"],
  
  // PTB > 5TH (Class 5)
  "5TH": ["English", "General Science", "Social Studies", "Mathematics", "اسلامیات", "اُردو"],
  
  // PTB > 6TH (Class 6)
  "6TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  
  // PTB > 7TH (Class 7)
  "7TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  
  // PTB > 8TH (Class 8)
  "8TH": ["ہوم اکنامکس", "پنجابی", "زرعی تعلیم", "ترجمۃ القرآن", "اسلامیات لازمی", "English", "Computer", "General Science", "Geography", "History", "Mathematics", "اُردو لازمی", "اخلاقیات"],
  
  // PTB > 9TH (Class 9)
  "9TH": ["Biology", "Computer", "Chemistry", "Physics", "Mathematics", "English", "اُردو لازمی", "اسلامیات لازمی", "General Science", "ایجوکیشن", "پنجابی", "اسلامیات اختیاری", "ہوم اکنامکس", "سوکس", "معاشیات", "ترجمۃ القرآن المجید", "اخلاقیات", "فزیکل ایجوکیشن", "مرغبانی", "غذا اور غذائیت"],
  
  // PTB > 10TH (Class 10)
  "10TH": ["Biology", "Computer", "Chemistry", "Physics", "Mathematics", "English", "اُردو لازمی", "اسلامیات لازمی", "General Science", "ایجوکیشن", "پنجابی", "اسلامیات اختیاری", "ہوم اکنامکس", "سوکس", "معاشیات", "ترجمۃ القرآن", "اخلاقیات", "فزیکل ایجوکیشن", "مرغبانی", "غذا اور غذائیت"],
  
  // PTB > INTER-I (Class 11)
  "INTER-I": ["Biology", "Chemistry", "Physics", "Mathematics", "Computer", "Statistics", "Economics", "English", "Principles of Accounting", "Principles of Economics", "Principles of Commerce", "Business Maths", "اسلامیات لازمی", "اُردو لازمی", "ایجوکیشن", "سوکس", "پنجابی", "اسلامیات اختیاری", "فزیکل ایجوکیشن", "سوشیالوجی", "اخلاقیات", "ترجمۃ القرآن مجید", "نفسیات", "فارسی", "تاریخِ اسلام", "حَدِیقَۃُ الاَدَبِ", "طبعی جغرافیہ", "لائبریری سائنس", "ہوم اکنامکس", "تاریخ پاکستان"],
  
  // PTB > INTER-II (Class 12)
  "INTER-II": ["Biology", "Chemistry", "Physics", "Mathematics", "Computer", "Statistics", "Economics", "English", "Principles of Accounting", "Principles of Banking", "Commercial Geography", "Business Statistics", "Pakistan Studies", "اُردو لازمی", "ایجوکیشن", "سوکس", "پنجابی", "اسلامیات اختیاری", "فزیکل ایجوکیشن", "سوشیالوجی", "اخلاقیات", "ترجمۃ القرآن مجید", "نفسیات", "فارسی", "تاریخِ اسلام", "حَدِیقَۃُ الاَدَبِ", "اِنسانی جغرافیہ", "لائبریری سائنس", "تاریخِ پاکستان", "ہوم اکنامکس"],
  
  // OLD BOOKS
  "OLD BOOKS": ["Biology Old", "Chemistry Old", "Physics Old", "Mathematics Old", "Computer Old", "English Old", "Urdu Old", "Islamiat Old"],
};

// ─── Book cover image URL generator ─────────────────────────────────────

function getBookCoverUrl(subject: string, className: string, syllabus: string): string {
  // Generate a search-friendly query for book covers
  const query = encodeURIComponent(`${subject} ${className} ${syllabus} textbook cover Pakistan`);
  // Use a placeholder image service with subject-based seed for consistency
  const seed = hashCode(`${subject}-${className}-${syllabus}`);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(subject.substring(0, 2))}&background=eff6ff&color=2563eb&size=200&font-size=0.4&bold=true`;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Subject icon mapping
function getSubjectIcon(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes("math")) return "Calculator";
  if (lower.includes("english")) return "Languages";
  if (lower.includes("urdu")) return "Type";
  if (lower.includes("biology")) return "Leaf";
  if (lower.includes("chemistry")) return "FlaskConical";
  if (lower.includes("physics")) return "Atom";
  if (lower.includes("computer")) return "Monitor";
  if (lower.includes("islamiat") || lower.includes("quran")) return "BookOpen";
  if (lower.includes("science")) return "Microscope";
  if (lower.includes("history") || lower.includes("pakistan studies")) return "Landmark";
  if (lower.includes("geography")) return "Globe";
  if (lower.includes("economics") || lower.includes("commerce") || lower.includes("accounting") || lower.includes("banking")) return "TrendingUp";
  if (lower.includes("statistics") || lower.includes("business")) return "BarChart3";
  if (lower.includes("home economics") || lower.includes("food")) return "ChefHat";
  if (lower.includes("sociology") || lower.includes("civics")) return "Users";
  if (lower.includes("fine arts")) return "Palette";
  if (lower.includes("punjabi") || lower.includes("persian")) return "BookText";
  return "BookOpen";
}

export function SubjectsSelectionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const syllabus = searchParams.get("syllabus") || "ptb";
  const className = searchParams.get("class") || "9TH";
  const syllabusLabel = syllabus.toUpperCase().replace("-", " ");
  const [search, setSearch] = useState("");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const subjects = subjectsByClass[className] || subjectsByClass["9TH"] || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter((s) => s.toLowerCase().includes(q));
  }, [subjects, search]);

  return (
    <SchoolShell eyebrow="Question Papers" title="Select Subject">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/question-papers/generate/classes?syllabus=${syllabus}`}
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Subject</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              <span className="font-bold text-blue-600">{syllabusLabel}</span>
              <span className="mx-1.5 text-slate-300">›</span>
              <span className="font-bold text-slate-700">{className}</span>
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
          <span className="text-blue-600">{className}</span>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <AppIcon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
          />
        </div>

        {/* Subjects Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <AppIcon name="Search" size={32} className="text-slate-200 mb-3" />
            <p className="text-[13px] font-bold text-slate-500">No subjects found</p>
            <p className="text-[11px] text-slate-400 mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((subject) => {
              const hasError = imgErrors.has(subject);
              return (
                <button
                  key={subject}
                  onClick={() => navigate(`/admin/question-papers/generate/chapters?syllabus=${syllabus}&class=${encodeURIComponent(className)}&subject=${encodeURIComponent(subject)}`)}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] flex items-center gap-4"
                >
                  {/* Book Image / Placeholder */}
                  <div className="h-16 w-14 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:bg-blue-100 transition-colors">
                    {!hasError ? (
                      <img
                        src={getBookCoverUrl(subject, className, syllabus)}
                        alt={subject}
                        className="h-full w-full object-cover rounded-lg"
                        onError={() => setImgErrors((prev) => new Set(prev).add(subject))}
                      />
                    ) : (
                      <AppIcon name={getSubjectIcon(subject)} size={24} className="text-blue-600" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-slate-900 truncate">{subject}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{syllabusLabel} · {className}</p>
                  </div>

                  {/* Arrow */}
                  <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <AppIcon name="ArrowRight" size={14} className="text-blue-600" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl">
          <div className="flex items-start gap-3">
            <AppIcon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-blue-700">
              Select a subject to open the question paper generator with pre-selected filters.
            </p>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
