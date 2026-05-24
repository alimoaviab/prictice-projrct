import { AppIcon } from "shared/ui/AppIcon";
import { useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperListPage } from "@/modules/question-papers/pages/QuestionPaperListPage";
import { QuestionBankPage } from "@/modules/question-bank/pages/QuestionBankPage";

type TabKey = "papers" | "bank";

export function TeacherQuestionPapersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("papers");

  return (
    <SchoolShell eyebrow="Academic" title="Question Papers">
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-5">
        <button onClick={() => setActiveTab("papers")} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "papers" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <AppIcon name="FileText" size={16} />
          Question Papers
        </button>
        <button onClick={() => setActiveTab("bank")} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          <AppIcon name="Library" size={16} />
          Question Bank
        </button>
      </div>
      {activeTab === "papers" && <QuestionPaperListPage />}
      {activeTab === "bank" && <QuestionBankPage />}
    </SchoolShell>
  );
}
