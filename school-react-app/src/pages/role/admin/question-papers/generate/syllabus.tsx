import { AppIcon } from "shared/ui/AppIcon";
import { Link, useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";

/**
 * Syllabus Selection Page
 * Clean white EduPlexo design - NO gradients
 */

interface SyllabusOption {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
}

const syllabusOptions: SyllabusOption[] = [
  { id: "ptb", name: "PTB", subtitle: "Punjab Textbook Board", icon: "BookOpen" },
  { id: "afaq-snc", name: "AFAQ SNC", subtitle: "Single National Curriculum", icon: "Globe" },
  { id: "oxford-snc", name: "OXFORD SNC", subtitle: "Oxford University Press", icon: "GraduationCap" },
  { id: "gohar-snc", name: "GOHAR SNC", subtitle: "Gohar Publishers", icon: "Library" },
  { id: "ba", name: "B.A", subtitle: "Bachelor of Arts", icon: "Award" },
];

export function SyllabusSelectionPage() {
  const navigate = useNavigate();

  return (
    <SchoolShell eyebrow="Question Papers" title="Select Syllabus">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/admin/question-papers"
            className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Select Syllabus</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">Choose a syllabus to generate question papers</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <Link to="/admin/question-papers" className="hover:text-blue-600 transition-colors">Question Papers</Link>
          <AppIcon name="ChevronRight" size={12} />
          <span className="text-blue-600">Select Syllabus</span>
          <AppIcon name="ChevronRight" size={12} />
          <span>Select Class</span>
          <AppIcon name="ChevronRight" size={12} />
          <span>Subjects</span>
        </div>

        {/* Syllabus Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {syllabusOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/admin/question-papers/generate/classes?syllabus=${s.id}`)}
              className="group bg-white rounded-2xl border border-slate-200/80 p-6 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 group-hover:bg-blue-100 transition-colors">
                <AppIcon name={s.icon} size={24} className="text-blue-600" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-1">{s.name}</h3>
              <p className="text-[12px] text-slate-500">{s.subtitle}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Select</span>
                <AppIcon name="ArrowRight" size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </SchoolShell>
  );
}
