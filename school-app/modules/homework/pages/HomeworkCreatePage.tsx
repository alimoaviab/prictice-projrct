"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Skeleton } from "../../../components/ui";
import { HomeworkForm } from "../components/HomeworkForm";
import { showToast } from "../../../utils/toast";

interface HomeworkCreatePageProps {
  role: "ADMIN" | "TEACHER";
}

export function HomeworkCreatePage({ role }: HomeworkCreatePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    classes: [],
    subjects: [],
    teachers: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isTeacher = role === "TEACHER";
      const endpoints = [
        fetch(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        fetch("/api/school/subjects"),
        ...(role === "ADMIN" ? [fetch("/api/teachers")] : [])
      ];

      const responses = await Promise.all(endpoints);
      const jsonData = await Promise.all(responses.map(r => r.json()));

      const extractArray = (res: any, key?: string) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (key && Array.isArray(res.data?.[key])) return res.data[key];
        if (key && Array.isArray(res[key])) return res[key];
        return [];
      };

      setFormData({
        classes: isTeacher ? extractArray(jsonData[0], "classes") : extractArray(jsonData[0]),
        subjects: extractArray(jsonData[1]),
        teachers: extractArray(jsonData[2])
      });
    } catch (error) {
      console.error(error);
      showToast("Failed to load required data", "error");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Homework assigned successfully", "success");
        router.push(role === "ADMIN" ? "/admin/homework" : "/teacher/homework");
        router.refresh();
      } else {
        showToast(result.error?.message || "Failed to assign homework", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6">
      <Link
        href={role === "ADMIN" ? "/admin/homework" : "/teacher/homework"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Homework List
      </Link>

      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Assign New Homework</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Create a new assignment for your students.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-[2.5rem]" />
          </div>
        ) : (
          <HomeworkForm
            onSubmit={handleSubmit}
            classes={formData.classes}
            subjects={formData.subjects}
            teachers={formData.teachers}
            showTeacherField={role === "ADMIN"}
            loading={submitting}
          />
        )}
      </Card>
    </div>
  );
}
