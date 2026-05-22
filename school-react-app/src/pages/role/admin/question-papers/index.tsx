import { useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { QuestionPaperListPage } from "@/modules/question-papers/pages/QuestionPaperListPage";
import { QuestionBankPage } from "@/modules/question-bank/pages/QuestionBankPage";
import { QuestionPaperGeneratorPage } from "@/modules/question-papers/pages/QuestionPaperGeneratorPage";

type TabKey = "papers" | "bank" | "generator";

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: "papers", label: "Question Papers", icon: "description" },
  { key: "bank", label: "Question Bank", icon: "library_books" },
  { key: "generator", label: "Paper Generator", icon: "auto_awesome" },
];

export function AdminQuestionPapersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("papers");

  return (
    <SchoolShell eyebrow="Academic" title="Question Papers">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${
              activeTab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "papers" && <QuestionPaperListPage />}
      {activeTab === "bank" && <QuestionBankPage />}
      {activeTab === "generator" && <QuestionPaperGeneratorPage />}
    </SchoolShell>
  );
}
