import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";

/**
 * Generate Paper - Method 2 (Coming Soon)
 * Clean white EduPlexo design
 */

export function Method2ComingSoonPage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="Method 2">
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Generate Paper — Method 2</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">Advanced AI-powered generation</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="flex items-center justify-center min-h-[380px]">
          <div className="text-center max-w-sm">
            <div className="h-20 w-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6">
              <AppIcon name="Zap" size={36} className="text-blue-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">Coming Soon</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-8">
              An advanced AI-powered paper generation method that automatically creates balanced question papers based on your syllabus and difficulty preferences.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <AppIcon name="Brain" size={18} className="text-blue-600 mb-2" />
                <p className="text-[11px] font-bold text-slate-900">AI-Powered</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Smart question selection</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <AppIcon name="Gauge" size={18} className="text-blue-600 mb-2" />
                <p className="text-[11px] font-bold text-slate-900">Auto Balance</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Difficulty distribution</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <AppIcon name="Clock" size={18} className="text-blue-600 mb-2" />
                <p className="text-[11px] font-bold text-slate-900">One Click</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Generate in seconds</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-left shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
                <AppIcon name="Layers" size={18} className="text-blue-600 mb-2" />
                <p className="text-[11px] font-bold text-slate-900">Multi-Variant</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Multiple paper sets</p>
              </div>
            </div>

            <Link
              to="/admin/question-papers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <AppIcon name="ArrowLeft" size={14} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
