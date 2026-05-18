/**
 * Live Class create page rebuilt on the Academic Year design system.
 *
 * Reuses the existing LiveClassForm component (Meet integration, validation,
 * status enum) and just provides the AY chrome around it. Publishes
 * "live-classes" on success so the timeline view refreshes immediately.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Skeleton,
  DataState,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
  GuidanceChecklist,
} from "@/components/ui";
import { LiveClassForm } from "../components/LiveClassForm";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";
import { bindRefresh, publish } from "@/services/data-bus";

interface LiveClassCreatePageProps {
  role: "ADMIN" | "TEACHER";
}

export function LiveClassCreatePage({ role }: LiveClassCreatePageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{ classes: any[]; teachers: any[] }>({
    classes: [],
    teachers: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const isTeacher = role === "TEACHER";

      const [classesRes, teachersRes] = await Promise.all([
        serviceRequest<any>(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        role === "ADMIN" ? serviceRequest<any>("/api/teachers") : Promise.resolve({ ok: true, data: [] }),
      ]);

      const extractArray = (res: any) => {
        if (!res?.ok) return [];
        const data = res.data;
        if (Array.isArray(data)) return data;
        if (data && typeof data === "object" && Array.isArray(data.data)) return data.data;
        return [];
      };

      setFormData({
        classes: extractArray(classesRes),
        teachers: extractArray(teachersRes),
      });
    } catch (error) {
      console.error("Failed to load form data", error);
      showToast(error instanceof Error ? error.message : "Could not load classes and teachers. Please refresh the page.", "error");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchData();
    const offC = bindRefresh("classes", fetchData);
    const offT = bindRefresh("teachers", fetchData);
    return () => {
      offC();
      offT();
    };
  }, [fetchData]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      // Map frontend camelCase to backend snake_case
      const payload = {
        title: data.title,
        class_id: data.classId,
        subject: data.subjectId, // The form stores subject name/id in subjectId field
        starts_at: data.startTime,
        ends_at: data.endTime,
        host_teacher_id: data.teacherId,
        audience_type: data.audienceType || "CLASS",      // Add audience type (CLASS or STUDENT)
        target_student_id: data.targetStudentId || "",    // Add target student for specific student mode
      };

      const result = await serviceRequest<any>("/api/live/classes/schedule", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (result.ok) {
        const resData = result.data;
        const meetingLink = resData?.join_url || resData?.meetingLink;
        
        const audienceText = data.audienceType === "STUDENT" ? "specific student" : "class students";
        if (meetingLink) {
          showToast(`Live class scheduled for ${audienceText}. Meeting link: ${meetingLink}`, "success");
        } else {
          showToast(`Live class scheduled for ${audienceText}`, "success");
        }
        
        publish("live-classes");
        setTimeout(() => {
          navigate(role === "ADMIN" ? "/admin/live-class" : "/teacher/live-class");
        }, 1200);
      } else {
        const errorMsg = result.message || "Failed to schedule class";
        showToast(errorMsg, "error");
      }
    } catch (err) {
      console.error("Schedule error:", err);
      showToast(err instanceof Error ? err.message : "Could not schedule the live class. Please check your input and try again.", "error");
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

  const backPath = role === "ADMIN" ? "/admin/live-class" : "/teacher/live-class";

  return (
    <EntityCreateLayout
      backTo={backPath}
      backLabel="Return to Live Classes"
      eyebrow="Session Composer"
      icon="videocam"
      title="Schedule a Live Session"
      subtitle="Set up a live video session — meeting links and calendar entries are dispatched automatically."
      asideTitle="Session Intelligence"
      aside={
        <>
          <GuidanceSection title="What gets shared?">
            Once scheduled, students in the selected class see the session in their portal with the
            meeting link, start time, and duration. Attendance is captured on join.
          </GuidanceSection>
          <GuidanceSection title="Meet Link">
            <GuidanceCallout tone="blue">
              A unique meeting link is generated automatically. You don't need to paste anything from
              an external tool.
            </GuidanceCallout>
          </GuidanceSection>
          <GuidanceChecklist
            items={[
              { done: formData.classes.length > 0, label: "Classes available" },
              {
                done: role === "TEACHER" || formData.teachers.length > 0,
                label: "Teacher assignable",
              },
              { done: true, label: "Start and end time picked" },
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
          <Skeleton className="h-32 w-full rounded-2xl" />
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
    </EntityCreateLayout>
  );
}
