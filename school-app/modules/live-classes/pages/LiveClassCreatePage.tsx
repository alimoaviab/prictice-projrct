"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { LiveClassForm } from "../components/LiveClassForm";
import { showToast } from "../../../utils/toast";

interface LiveClassCreatePageProps {
  role: "ADMIN" | "TEACHER";
}

export function LiveClassCreatePage({ role }: LiveClassCreatePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    classes: [],
    teachers: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isTeacher = role === "TEACHER";
      
      const endpoints = [
        fetch(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        ...(role === "ADMIN" ? [fetch("/api/teachers")] : [])
      ];

      const responses = await Promise.all(endpoints);
      const jsonData = await Promise.all(responses.map(r => r.json()));

      const classesRes = jsonData[0];
      const teachersRes = jsonData[1];

      // Robust data extraction
      const extractArray = (res: any, key?: string) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (key && Array.isArray(res.data?.[key])) return res.data[key];
        if (key && Array.isArray(res[key])) return res[key];
        return [];
      };

      setFormData({
        classes: isTeacher 
          ? extractArray(classesRes, "classes") 
          : extractArray(classesRes),
        teachers: extractArray(teachersRes)
      });
    } catch (error) {
      console.error("Failed to load form data", error);
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
      const res = await fetch("/api/live/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && (result.success || result.data?.success)) {
        const meetingLink = result.data?.meetingLink;
        if (meetingLink) {
          showToast(`Live class scheduled! Meeting link: ${meetingLink}`, "success");
        } else {
          showToast("Live class scheduled successfully", "success");
        }
        
        // Redirect after a short delay to show the toast
        setTimeout(() => {
          router.push(role === "ADMIN" ? "/admin/live-class" : "/teacher/live-class");
          router.refresh();
        }, 1500);
      } else {
        const errorMsg = result.error || result.data?.error || "Failed to schedule class";
        showToast(errorMsg, "error");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      showToast("An error occurred during scheduling", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && formData.classes.length === 0 && role === "TEACHER") {
     return (
       <DataState 
         variant="error" 
         title="No Classes Assigned" 
         message="You must have assigned classes to schedule a live session. Please contact the administrator."
       />
     );
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      <Link
        href={role === "ADMIN" ? "/admin/live-class" : "/teacher/live-class"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Live Classes
      </Link>

      <Card className="p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 normal-case tracking-tight">Schedule New Live Session</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Setup a live video session for your students. Meeting links will be automatically shared.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : (
          <LiveClassForm
            onSubmit={handleSubmit}
            classes={formData.classes}
            teachers={formData.teachers}
            showTeacherField={role === "ADMIN"}
            loading={submitting}
          />
        )}
      </Card>
    </div>
  );
}
