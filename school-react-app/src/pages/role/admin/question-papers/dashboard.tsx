import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";

/**
 * Question Paper Module Dashboard
 * 
 * Clean white EduPlexo design - NO gradients
 * 3 white cards: Generate Paper, Method 2 (Coming Soon), Saved Papers
 */

interface DashboardCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  disabled?: boolean;
  badge?: string;
}

const cards: DashboardCard[] = [
  {
    id: "generate-1",
    title: "Generate Paper",
    subtitle: "Unified syllabus, class, chapter & type filters",
    icon: "Sparkles",
    href: "/admin/question-papers/generator",
  },
  {
    id: "premium-generator",
    title: "Premium Paper Generator",
    subtitle: "Professional paper-making software",
    icon: "Crown",
    href: "/admin/question-papers/premium-generator",
    badge: "Premium",
  },
  {
    id: "smart-generator",
    title: "Smart Paper Generator",
    subtitle: "AI-powered premium paper builder",
    icon: "Wand2",
    href: "/admin/question-papers/smart-generator",
    badge: "New",
  },
  {
    id: "generate-2",
    title: "Generate Paper",
    subtitle: "Method 2",
    icon: "Zap",
    href: "/admin/question-papers/generate/method2",
    disabled: true,
    badge: "Coming Soon",
  },
  {
    id: "saved-papers",
    title: "Saved Papers",
    subtitle: "Download / Print Papers",
    icon: "FileText",
    href: "/admin/question-papers/saved",
  },
];

export function QuestionPaperDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Question Paper Module</h1>
        <p className="text-[13px] text-slate-500">
          Generate professional question papers, manage saved papers, and sub-user accounts
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <DashboardCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

function DashboardCardItem({ card }: { card: DashboardCard }) {
  const content = (
    <div className={`relative bg-white rounded-2xl border border-slate-200/80 p-6 h-44 flex flex-col justify-between transition-all duration-200 ${!card.disabled ? "hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : "opacity-50 cursor-not-allowed"} shadow-[0_2px_10px_rgba(0,0,0,0.04)]`}>
      {/* Badge */}
      {card.badge && (
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-blue-50 rounded-full text-[9px] font-bold text-blue-600 border border-blue-100">
          {card.badge}
        </div>
      )}

      {/* Top */}
      <div>
        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
          <AppIcon name={card.icon} size={22} className="text-blue-600" />
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 mb-1">{card.title}</h3>
        <p className="text-[12px] text-slate-500">{card.subtitle}</p>
      </div>

      {/* Bottom Arrow */}
      {!card.disabled && (
        <div className="flex items-center justify-end">
          <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
            <AppIcon name="ArrowRight" size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      )}
    </div>
  );

  if (card.disabled) {
    return <div className="group">{content}</div>;
  }

  return (
    <Link to={card.href} className="group">
      {content}
    </Link>
  );
}
