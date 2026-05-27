import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";

/**
 * Sub Users Management Page
 * Clean white EduPlexo design
 */

export function SubUsersPage() {
  return (
    <SchoolShell eyebrow="Question Papers" title="Sub Users">
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sub Users</h1>
            <p className="text-[12px] text-slate-500 mt-0.5">Create and manage sub-user accounts</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
            <AppIcon name="Users" size={28} className="text-blue-300" />
          </div>
          <h3 className="text-[15px] font-bold text-slate-900 mb-1">Sub Users Management</h3>
          <p className="text-[12px] text-slate-500 mb-5 text-center max-w-xs">
            Create sub-user accounts to allow others to generate and manage question papers.
          </p>
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-bold text-blue-600">
            Coming Soon
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
