/**
 * Question Papers — List page showing all created papers.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton, DataState, ConfirmModal } from "@/components/ui";
import { useQuestionPapers } from "../hooks/useQuestionPapers";

export function QuestionPaperListPage() {
  const navigate = useNavigate();
  const { state, remove } = useQuestionPapers();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const papers = state.data || [];
  const isLoading = state.status === "loading" || state.status === "idle";

  async function handleDelete() {
    if (!pendingDelete) return;
    await remove(pendingDelete);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-lg">description</span>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">Question Papers</p>
            <p className="text-[10px] font-bold text-slate-400">{papers.length} papers</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/question-papers/create")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-indigo-600 text-white text-[12px] font-bold shadow-sm shadow-indigo-600/15 hover:bg-indigo-700 transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Create New Paper
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && papers.length === 0 && (
        <DataState
          variant="empty"
          title="No question papers yet"
          message="Create your first question paper to get started."
        />
      )}

      {/* Table */}
      {!isLoading && papers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Title</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teacher</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Created</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {papers.map((paper) => (
                  <tr key={paper._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{paper.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{paper.class_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">{paper.teacher_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {paper.date ? new Date(paper.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-400">
                      {new Date(paper.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/question-papers/${paper._id}`}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors"
                          title="View"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                        </Link>
                        <button
                          onClick={() => setPendingDelete(paper._id)}
                          className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete this question paper?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
