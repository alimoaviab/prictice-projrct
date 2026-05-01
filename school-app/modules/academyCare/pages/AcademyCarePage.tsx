"use client";

import { Card, DataState, Skeleton, TableSkeleton } from "../../../components/ui";
import { AcademyCareForm } from "../components/AcademyCareForm";
import { AcademyCareTable } from "../components/AcademyCareTable";
import { useAcademyCare } from "../hooks/useAcademyCare";

export function AcademyCarePage() {
    const { state, addAcademyYear } = useAcademyCare();

    return (
        <div className="flex flex-col gap-8">
            <Card className="max-w-4xl">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Manage Academy Care</h2>
                    <p className="text-sm text-gray-500">Configure academic years and institutional care settings.</p>
                </div>
                <AcademyCareForm onCreate={addAcademyYear} />
            </Card>

            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-4">
                   <Skeleton className="h-8 w-48" />
                   <TableSkeleton />
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load academic years" message={state.error} />
            ) : null}

            {state.status === "empty" ? (
                <DataState variant="empty" title="No academic years created" message="Create the first academic year to begin." />
            ) : null}

            {state.status === "success" && state.data && state.data.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Academic Years History</h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                           {state.data.length} Total
                        </span>
                    </div>
                    <AcademyCareTable years={state.data} />
                </div>
            ) : null}
        </div>
    );
}
