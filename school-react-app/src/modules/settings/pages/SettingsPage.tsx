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
            <div className="space-y-6">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <div className="grid grid-cols-4 gap-6">
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
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
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3 space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-8 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            <span className="text-[10px] font-bold normal-case ">Enterprise Plan</span>
                        </div>
                        <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                            Your institutional data is protected with 256-bit encryption.
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-6">
                    <div className="premium-card p-6 md:p-8">
                        <div className="mb-8 border-b border-slate-100 pb-6">
                           <h2 className="text-xl font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h2>
                           <p className="text-sm text-slate-500 mt-1">Configure your institution's {activeTab} parameters and visibility.</p>
                        </div>
                        
                        <SettingsForm initialValues={school} onSave={saveSettings} activeTab={activeTab} />
                    </div>
                </div>
            </div>
        </div>
    );
}
