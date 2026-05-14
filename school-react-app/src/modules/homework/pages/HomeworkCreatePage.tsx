/**
 * Homework create page rebuilt on the Academic Year design system.
 *
 * Reuses the existing HomeworkForm component (which fetches its own
 * subjects-by-class) and just provides the AY-style chrome around it.
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
      const endpoints = [
        fetch(isTeacher ? "/api/school/my-classes" : "/api/classes", {
          credentials: "include",
        }),
        fetch("/api/school/subjects", { credentials: "include" }),
        ...(role === "ADMIN"
          ? [fetch("/api/teachers", { credentials: "include" })]
          : []),
      ];

      const responses = await Promise.all(endpoints);
      const jsonData = await Promise.all(responses.map((r) => r.json()));

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
          ? extractArray(jsonData[0], "classes")
          : extractArray(jsonData[0]),
        subjects: extractArray(jsonData[1]),
        teachers: extractArray(jsonData[2]),
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
    // Refresh dependencies when classes/teachers/subjects change anywhere.
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
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Homework assigned successfully", "success");
        publish("homework");
        navigate(role === "ADMIN" ? "/admin/homework" : "/teacher/homework");
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
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
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
