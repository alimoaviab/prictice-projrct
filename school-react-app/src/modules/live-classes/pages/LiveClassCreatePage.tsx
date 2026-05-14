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

      const endpoints = [
        fetch(isTeacher ? "/api/school/my-classes" : "/api/classes"),
        ...(role === "ADMIN" ? [fetch("/api/teachers")] : []),
      ];

      const responses = await Promise.all(endpoints);
      const jsonData = await Promise.all(responses.map((r) => r.json()));

      const classesRes = jsonData[0];
      const teachersRes = jsonData[1];

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
        teachers: extractArray(teachersRes),
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
      const res = await fetch("/api/live/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && (result.success || result.data?.success)) {
        const meetingLink = result.data?.meetingLink;
        if (meetingLink) {
          showToast(`Live class scheduled. Meeting link: ${meetingLink}`, "success");
        } else {
          showToast("Live class scheduled successfully", "success");
        }
        publish("live-classes");
        setTimeout(() => {
          navigate(role === "ADMIN" ? "/admin/live-class" : "/teacher/live-class");
        }, 1200);
      } else {
        const errorMsg =
          result.error || result.data?.error || "Failed to schedule class";
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
