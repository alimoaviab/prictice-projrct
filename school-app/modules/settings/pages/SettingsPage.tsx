"use client";

import { Card, DataState, Skeleton } from "../../../components/ui";
import { SettingsForm } from "../components/SettingsForm";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
    const { state, saveSettings } = useSettings();

    const profileCards = state.status === "success" && state.data ? [
        { label: "School Name", value: state.data.academy_name || "Not set", icon: "school" },
        { label: "Principal", value: state.data.principal_name || "Not set", icon: "person" },
        { label: "Contact Phone", value: state.data.academy_phone || "Not set", icon: "phone" },
        { label: "Contact Email", value: state.data.academy_email || "Not set", icon: "mail" }
    ] : [];

    return (
        <div className="flex flex-col gap-8">
            {state.status === "loading" || state.status === "idle" ? (
                <div className="space-y-6">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <div className="grid grid-cols-4 gap-6">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
            ) : null}

            {state.status === "error" ? (
                <DataState variant="error" title="Failed to load settings" message={state.error} />
            ) : null}

            {state.status === "success" && state.data ? (
                <>
                    <Card className="max-w-4xl">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
                            <p className="text-sm text-gray-500">Manage school-wide configuration and institutional details.</p>
                        </div>
                        <SettingsForm initialValues={state.data} onSave={saveSettings} />
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {profileCards.map((item) => (
                            <Card key={item.label} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                                    <p className="text-sm font-semibold text-gray-700 truncate max-w-[150px]">{item.value}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}
