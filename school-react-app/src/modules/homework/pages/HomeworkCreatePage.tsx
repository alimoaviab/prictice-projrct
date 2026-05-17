/**
 * /admin/homework/create — Homework assignment creation page.
 *
 * Root causes of the previous broken state:
 *   1. Raw fetch() without Authorization header → 401 → empty dropdowns
 *   2. Wrong subject endpoint (/api/school/subjects/class/{id} ignores classId)
 *   3. section_id vs section field name mismatch
 *
 * Fix: use serviceRequest() for all API calls (attaches JWT + academic
 * year header automatically), use correct endpoints, fix field names.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Skeleton,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
  GuidanceChecklist,
} from "@/components/ui";
import { HomeworkForm } from "../components/HomeworkForm";
import { showToast } from "@/utils/toast";
import { bindRefresh, publish } from "@/services/data-bus";
import { serviceRequest } from "@/services/service-client";

interface HomeworkCreatePageProps {
  role: "ADMIN" | "TEACHER";
}

export function HomeworkCreatePage({ role }: HomeworkCreatePageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

      // Use serviceRequest which attaches JWT + academic-year header.
      // Raw fetch() was the root cause of empty dropdowns — it didn't
      // send the Authorization header so the backend returned 401.
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        serviceRequest<any>(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        serviceRequest<any>("/api/subjects"),
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
    } catch (error) {
      console.error("[HomeworkCreatePage] Failed to load data:", error);
      showToast(error instanceof Error ? error.message : "Could not load classes, subjects, or teachers. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
    const offC = bindRefresh("classes", fetchData);
    const offT = bindRefresh("teachers", fetchData);
    const offS = bindRefresh("subjects", fetchData);
    return () => {
      offC();
      offT();
      offS();
    };
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      // Use serviceRequest (not raw fetch) so JWT is attached.
      const result = await serviceRequest<any>("/api/homework", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (result.ok) {
        showToast("Homework assigned successfully", "success");
        publish("homework");
        navigate(role === "ADMIN" ? "/admin/homework" : "/teacher/homework");
      } else {
        showToast(result.error?.message || result.message || "Failed to assign homework", "error");
      }
    } catch (err: any) {
      console.error("[HomeworkCreatePage] Submit error:", err);
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
      eyebrow="Assignment Composer"
      icon="assignment_add"
      title="Assign New Homework"
      subtitle="Create a new homework task and pin it to a class, subject, and due date."
      asideTitle="Assignment Intelligence"
      aside={
        <>
          <GuidanceSection title="How is it delivered?">
            Once published, students in the selected class see the assignment in their portal and a
            pending submission record is created automatically.
          </GuidanceSection>
          <GuidanceSection title="Due Time Rule">
            <GuidanceCallout tone="blue">
              Due dates are clamped to 23:59 on the chosen day, so submissions accept work through the
              entire day.
            </GuidanceCallout>
          </GuidanceSection>
          <GuidanceChecklist
            items={[
              { done: formData.classes.length > 0, label: "Classes available" },
              { done: formData.subjects.length > 0, label: "Subjects available" },
              {
                done: role === "TEACHER" || formData.teachers.length > 0,
                label: "Teacher assignable",
              },
            ]}
          />
        </>
      }
    >
      {loading ? (
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
          showTeacherField={role === "ADMIN"}
          initialTeacherId={role === "TEACHER" ? user?.profileId : ""}
          loading={submitting}
        />
      )}
    </EntityCreateLayout>
  );
}
