import { Card, DataState, Skeleton, TableSkeleton } from "@/components/ui";
import { useCallback, useEffect } from "react";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TestForm } from "../components/TestForm";
import { TestTable } from "../components/TestTable";
import { useTests } from "../hooks/useTests";

export function TestPage() {
    const { state, addTest } = useTests();
    const { state: classState, run: runClasses } = useSafeAsync<any[]>();

    const loadData = useCallback(() => {
        return runClasses(async () => {
            const result = await serviceRequest<any[]>("/api/classes");
            if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
            return result.data;
        });
    }, [runClasses]);

    useEffect(() => {
        void loadData().catch(() => {});
    }, [loadData]);

    const isDependencyLoading = 
        classState.status === "idle" || classState.status === "loading";

    return (
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Schedule Test</h2>
                    <p className="text-sm text-gray-500">Create a new testination schedule for specific classes and subjects.</p>
                </div>
                {isDependencyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
                    <TestForm 
                        classes={classState.data ?? []} 
                        onCreate={addTest} 
                    />
                )}
            </Card>

            {classState.status === "error" ? <DataState variant="error" title="Classes unavailable" message={classState.error} /> : null}

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? <DataState variant="error" title="Failed to load tests" message={state.error} /> : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No tests scheduled" message="Schedule tests for your academic year." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Scheduled Tests</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Total
                        </span>
                    </div>
                    <TestTable rows={state.data} />
                </div>
            ) : null}
        </div>
    );
}
