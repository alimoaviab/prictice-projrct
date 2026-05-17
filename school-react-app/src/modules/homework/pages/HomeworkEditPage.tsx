/**
 * /admin/homework/edit/:id — Homework edit page.
 *
 * Fixed: uses serviceRequest() instead of raw fetch() so JWT + academic
 * year headers are attached (same root cause as the create page).
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Skeleton,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
} from "@/components/ui";
import { HomeworkForm } from "../components/HomeworkForm";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";
import { publish } from "@/services/data-bus";

interface HomeworkEditPageProps {
  role: "ADMIN" | "TEACHER";
  id: string;
}

export function HomeworkEditPage({ role, id }: HomeworkEditPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [homework, setHomework] = useState<any>(null);
  const [formData, setFormData] = useState<{
    classes: any[];
    subjects: any[];
    teachers: any[];
  }>({
    classes: [],
    subjects: [],
    teachers: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isTeacher = role === "TEACHER";
      const [classesRes, subjectsRes, hwRes, teachersRes] = await Promise.all([
        serviceRequest<any>(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        serviceRequest<any>("/api/subjects"),
        serviceRequest<any>(`/api/homework/${encodeURIComponent(id)}`),
        role === "ADMIN"
          ? serviceRequest<any>("/api/teachers")
          : Promise.resolve({ ok: true, data: [] } as any),
      ]);

      const extractArray = (res: any): any[] => {
        if (!res.ok) return [];
        const d = res.data;
        if (Array.isArray(d)) return d;
        if (d && Array.isArray(d.data)) return d.data;
        if (d && Array.isArray(d.items)) return d.items;
        return [];
      };

      setFormData({
        classes: extractArray(classesRes),
        subjects: extractArray(subjectsRes),
        teachers: extractArray(teachersRes),
      });
      setHomework(hwRes.ok ? hwRes.data : null);
    } catch (error) {
      console.error("[HomeworkEditPage] Failed to load data:", error);
      showToast(error instanceof Error ? error.message : "Could not load homework details. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  }, [role, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const result = await serviceRequest<any>(
        `/api/homework/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );

      if (result.ok) {
        showToast("Homework updated successfully", "success");
        publish("homework");
        navigate(role === "ADMIN" ? "/admin/homework" : "/teacher/homework");
      } else {
        showToast(
          result.error?.message || result.message || "Failed to update homework",
          "error"
        );
      }
    } catch (err: any) {
      console.error("[HomeworkEditPage] Submit error:", err);
      showToast(err.message || "An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const backPath = role === "ADMIN" ? "/admin/homework" : "/teacher/homework";

  return (
    <EntityCreateLayout
      backTo={backPath}
      backLabel="Return to Homework"
      eyebrow="Assignment Editor"
      icon="edit_note"
      title="Edit Homework"
      subtitle="Modify the assignment details, due date, or reassign."
      asideTitle="Edit Notes"
      aside={
        <>
          <GuidanceSection title="What changes?">
            Updating the class or subject won't retroactively change existing
            submissions. Students already notified keep their pending status.
          </GuidanceSection>
          <GuidanceSection title="Due date extension">
            <GuidanceCallout tone="amber">
              Extending the due date re-opens submissions for students who
              haven't submitted yet.
            </GuidanceCallout>
          </GuidanceSection>
        </>
      }
    >
      {loading || !homework ? (
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <HomeworkForm
          onSubmit={handleSubmit}
          classes={formData.classes}
          subjects={formData.subjects}
          teachers={formData.teachers}
          initialValues={homework}
          showTeacherField={role === "ADMIN"}
          loading={submitting}
        />
      )}
    </EntityCreateLayout>
  );
}
