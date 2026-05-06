"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { useAcademicYears } from "../hooks/useAcademicYears";
import { AcademicYearRow, AcademicYearUpdateInput } from "../types/academicYear.types";
import { showToast } from "../../../utils/toast";
import { AcademicYearEditSidebar } from "../components/AcademicYearEditSidebar";

export function AcademicYearListPage() {
  const { state, updateAcademicYear, deleteAcademicYear } = useAcademicYears();
  const [editingYear, setEditingYear] = useState<AcademicYearRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Failed to load academic years" message={state.error} />;
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-black tracking-tight">Academic Sessions</h2>
          <p className="text-xs font-medium text-slate-500">Manage year windows with less clutter and faster actions.</p>
        </div>
        <div className="flex items-center gap-2.5">
           <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-white border border-blue-100 rounded-lg shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Total</span>
                <span className="text-sm font-bold text-black leading-none">{(state.data || []).length}</span>
              </div>
              <div className="w-px h-6 bg-blue-100" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.14em]">Active</span>
                <span className="text-[11px] font-semibold text-blue-700 leading-none uppercase">
                  {(state.data || []).find(y => y.is_active)?.year || "None"}
                </span>
              </div>
           </div>
           <Link
            href="/admin/academic-years/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-[0.98] uppercase tracking-[0.12em]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Session
          </Link>
        </div>
      </div>

      {(state.data || []).length === 0 ? (
        <div className="bg-white border border-blue-100 rounded-2xl p-8 shadow-sm text-center">
          <DataState
            variant="empty"
            title="No academic years found"
            message="Get started by creating the first academic year for your school."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(state.data || []).map((row) => (
            <div
              key={row._id}
              className={`group bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col relative overflow-hidden ${row.is_active ? 'border-blue-200' : 'border-slate-200'}`}
            >
              {row.is_active && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-50 rounded-full flex items-center justify-center text-blue-700 border border-blue-200">
                   <span className="material-symbols-outlined text-[12px] font-black">check</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[15px] text-black tracking-tight truncate">{row.year}</h3>
                    <Badge
                      variant={row.status === 'active' ? 'success' : 'gray'}
                      className="uppercase text-[9px] font-bold tracking-[0.1em] px-2 py-0.5 rounded-md"
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide truncate">
                    {row.description || "School Session"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 uppercase tracking-[0.12em]">Begins</span>
                  <span className="font-semibold text-slate-800">
                    {row.start_date ? new Date(row.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500 uppercase tracking-[0.12em]">Ends</span>
                  <span className="font-semibold text-slate-800">
                    {row.end_date ? new Date(row.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-end gap-1.5 pt-2.5 border-t border-slate-100">
                
                <button
                  onClick={() => setEditingYear(row)}
                  className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all"
                  title="Edit"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Delete ${row.year}?`)) {
                      const result = await deleteAcademicYear(row._id);
                      if (!result.ok) {
                        showToast(result.error.message || "Error", "error");
                      } else {
                        showToast(`${row.year} deleted`, "success");
                      }
                    }
                  }}
                  className="h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AcademicYearEditSidebar
        academicYear={editingYear}
        isOpen={editingYear !== null}
        onClose={() => setEditingYear(null)}
        onSave={async (id, data) => {
          setIsSaving(true);
          try {
            await updateAcademicYear(id, data as AcademicYearUpdateInput);
          } finally {
            setIsSaving(false);
          }
        }}
        isSaving={isSaving}
      />
    </div>
  );
}
