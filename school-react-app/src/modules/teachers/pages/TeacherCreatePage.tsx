/**
 * Teacher create page rebuilt on the Academic Year design system.
 *
 * Same visual contract as AcademicYearCreatePage — left form 68%,
 * right guidance panel 32%, max-w-7xl, 24px rounded card, 9x9 blue
 * accent square header. The TeacherForm component is preserved.
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Skeleton,
  DataState,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
  GuidanceChecklist,
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TeacherForm } from "../components/TeacherForm";
import { useTeachers } from "../hooks/useTeachers";
import { TeacherFormInput } from "../types/teacher.types";
import { showToast } from "@/utils/toast";
import { bindRefresh } from "@/services/data-bus";

export function TeacherCreatePage() {
  const navigate = useNavigate();
  const { addTeacher } = useTeachers();
  const { state: classState, run } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadClasses = useCallback(() => {
    return run(async () => {
      const result = await serviceRequest<any>("/api/classes");
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load classes");
      }
      const data: any = result.data;
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.data) ? data.data : [];
    });
  }, [run]);

  useEffect(() => {
    void loadClasses().catch(() => {});
    return bindRefresh("classes", loadClasses);
  }, [loadClasses]);

  const isClassDependencyLoading =
    classState.status === "idle" || classState.status === "loading";
  const classOptions = (classState.data ?? []).map((item) => ({
    id: item._id,
    label: item.name,
  }));

  async function handleCreate(input: TeacherFormInput) {
    const result = await addTeacher(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Teacher added successfully", "success");
      navigate("/admin/teachers");
    }
    return result;
  }

  return (
    <EntityCreateLayout
      backTo="/admin/teachers"
      backLabel="Return to Faculty"
      eyebrow="Faculty Onboarding"
      icon="person_add"
      title="Register New Teacher"
      subtitle="Provision a faculty account with credentials, contact details, and class assignment."
      asideTitle="Onboarding Intelligence"
      aside={
        <>
          <GuidanceSection title="What gets created?">
            A teacher record plus a companion login account. The teacher signs in with the email and
            password you set here.
          </GuidanceSection>
          <GuidanceSection title="Class Assignment">
            <GuidanceCallout tone="blue">
              You can leave the class blank and assign it later. Teachers can be reassigned at any time.
            </GuidanceCallout>
          </GuidanceSection>
          <GuidanceChecklist
            items={[
              { done: classOptions.length > 0, label: "Classes available to assign" },
              { done: true, label: "Email and phone are reachable" },
              { done: true, label: "Password meets school policy" },
            ]}
          />
        </>
      }
    >
      {classState.status === "error" ? (
        <DataState
          variant="error"
          title="Failed to load classes"
          message={classState.error}
        />
      ) : isClassDependencyLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <TeacherForm onSubmit={handleCreate} classOptions={classOptions} mode="create" />
      )}
    </EntityCreateLayout>
  );
}
