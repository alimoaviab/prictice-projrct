"use client";

import { useState } from "react";
import { useSubjects } from "../hooks/useSubjects";
import { SubjectEditSidebar } from "../components/SubjectEditSidebar";
import { SubjectRow, SubjectFormInput } from "../types";
import { showToast } from "@/utils/toast";

export function SubjectListPage() {
  const { data, isLoading, error, createSubject, updateSubject, deleteSubject } = useSubjects();

  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(id: string | null, formData: SubjectFormInput) {
    try {
      setIsSaving(true);
      if (id) {
        await updateSubject(id, formData);
        showToast("Subject updated successfully");
      } else {
        await createSubject(formData);
        showToast("Subject created successfully");
      }
      setEditingSubject(null);
      setIsAdding(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save subject");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      showToast("Subject deleted successfully");
    } catch (err: any) {
      showToast(err.message || "Failed to delete subject");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 min-h-[400px] flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl mb-2 text-red-500">error</span>
        <p className="font-medium text-red-800">Error Loading Subjects</p>
        <p className="text-sm mt-1">{error || "Something went wrong"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          Add Subject
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data || []).map((row) => (
          <div
            key={row._id}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {row.code ? row.code.substring(0, 2) : row.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{row.name}</h3>
                    {row.code && <p className="text-xs text-gray-500 uppercase">{row.code}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingSubject(row)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(row._id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              {row.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{row.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                  {row.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-gray-400 text-3xl">menu_book</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Subjects Found</h3>
          <p className="text-gray-500 mb-6">Get started by creating the first subject.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Add Subject
          </button>
        </div>
      )}

      <SubjectEditSidebar
        isOpen={isAdding || editingSubject !== null}
        subject={editingSubject}
        onClose={() => {
          setIsAdding(false);
          setEditingSubject(null);
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </>
  );
}
