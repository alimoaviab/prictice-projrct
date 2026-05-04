"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import BehaviorForm from "../components/BehaviorForm";
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorFormInput } from "../types/behavior.types";
import { showToast } from "../../../utils/toast";

export function BehaviorCreatePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { addBehavior } = useBehavior();

  const { state: studentState, run: runStudents } = useSafeAsync<Array<{ _id: string; name: string; class_id?: string }>>();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runStudents(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/students");
        if (!result.ok) throw new Error(result.error.message || "Failed to load students");
        return result.data;
      }),
      runClasses(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
        if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
        return result.data;
      })
    ]);
  }, [runStudents, runClasses]);

  useEffect(() => {
    void loadDependencies().catch(() => { });
  }, [loadDependencies]);

  const isLoading = studentState.status === "loading" || classState.status === "loading" || studentState.status === "idle";

  async function handleCreate(input: BehaviorFormInput) {
    const result = await addBehavior(input);
    if (result.ok) {
      showToast("Behavior record added successfully", "success");
      const basePath = pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior";
      router.push(basePath);
      router.refresh();
    } else {
      showToast(result.error.message || "Failed to add record", "error");
    }
    return result;
  }

  if (studentState.status === "error" || classState.status === "error") {
    return <DataState variant="error" title="Failed to load dependencies" message={studentState.error || classState.error} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior"}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Behavior Records
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">New Behavior Record</h2>
          <p className="text-sm text-gray-500 mt-1">
            Record a new disciplinary incident or student achievement.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <BehaviorForm
            onSubmit={handleCreate}
            onCancel={() => router.push(pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior")}
            students={studentState.data ?? []}
            classes={classState.data ?? []}
          />
        )}
      </Card>
    </div>
  );
}
