"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, DataState, Skeleton } from "../../../components/ui";
import { showToast } from "../../../utils/toast";

interface HomeworkPageProps {
  role: "ADMIN" | "TEACHER";
}

export function HomeworkPage({ role }: HomeworkPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);

  const fetchHomeworks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/homework");
      const result = await res.json();
      if (res.ok && result.success) {
        setHomeworks(result.data || []);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to load homeworks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this homework?")) return;
    try {
      const res = await fetch(`/api/homework/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Homework deleted", "success");
        fetchHomeworks();
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to delete homework", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Homework Management</h1>
          <p className="text-slate-500 font-medium mt-1">Assign and manage homework for your classes.</p>
        </div>
        <Button
          onClick={() => router.push(role === "ADMIN" ? "/admin/homework/create" : "/teacher/homework/create")}
          className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 text-[11px] font-black uppercase tracking-widest"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          New Homework
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />
          ))}
        </div>
      ) : homeworks.length === 0 ? (
        <DataState
          variant="empty"
          title="No Homework Assigned"
          message="You haven't assigned any homework yet. Start by clicking 'New Homework'."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw) => (
            <Card key={hw._id} className="p-6 group hover:shadow-2xl transition-all duration-300 border-slate-100 hover:border-indigo-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {hw.class_name}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Due: {hw.due_at}
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                  {hw.title}
                </h3>
                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4">
                  {hw.instructions || "No instructions provided."}
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined text-sm font-bold">book</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{hw.subject_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-black uppercase">
                    {hw.teacher_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{hw.teacher_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(role === "ADMIN" ? `/admin/homework/edit/${hw._id}` : `/teacher/homework/edit/${hw._id}`)}
                    className="h-8 w-8 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(hw._id)}
                    className="h-8 w-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
