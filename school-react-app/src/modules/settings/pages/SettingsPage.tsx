import { AppIcon } from "shared/ui/AppIcon";
import { useState } from "react";
import { Card, DataState, Skeleton } from "@/components/ui";
import { SettingsForm } from "../components/SettingsForm";
import { useSettings } from "../hooks/useSettings";

export function SettingsPage() {
    const { state, saveSettings } = useSettings();

    const [activeTab, setActiveTab] = useState<"general" | "contact" | "academic" | "branding">("general");

    const tabs = [
        { id: "general", label: "General Information", icon: "school" },
        { id: "contact", label: "Contact & Location", icon: "location_on" },
        { id: "academic", label: "Academic Settings", icon: "menu_book" },
        { id: "branding", label: "Logo & Branding", icon: "palette" },
    ] as const;

    if (state.status === "loading" || state.status === "idle") {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
        );
    }

    if (state.status === "error") {
        return (
            <div className="flex flex-col items-center py-12">
                <DataState variant="error" title="Failed to load settings" message={state.error || "Something went wrong"} />
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-sm"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    const school = state.data;
    if (!school) return null;

    return (
        <div className="space-y-5">
            {/* Horizontal Tabs */}
            <div
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 flex items-center gap-1"
                style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                <style>{`.settings-tabs::-webkit-scrollbar { display: none; }`}</style>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ flexShrink: 0 }}
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        <AppIcon name={tab.icon} size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="premium-card p-5 md:p-6">
                <div className="mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h2>
                    <p className="text-xs text-slate-500 mt-1">Configure your institution's {activeTab} parameters and visibility.</p>
                </div>

                <SettingsForm initialValues={school} onSave={saveSettings} activeTab={activeTab} />
            </div>
        </div>
    );
}
