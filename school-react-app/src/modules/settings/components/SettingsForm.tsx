import { AppIcon } from "shared/ui/AppIcon";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { SettingsFormInput } from "../types/settings.types";
import {
    compressImageToBudget,
    formatBytes,
} from "@/utils/image-compress";
import { showToast } from "@/utils/toast";

const ACCEPTED_LOGO_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml";

export function SettingsForm({
    initialValues,
    onSave,
    activeTab
}: {
    initialValues: SettingsFormInput;
    onSave: (values: SettingsFormInput) => Promise<unknown>;
    activeTab: "general" | "contact" | "academic" | "branding";
}) {
    const [form, setForm] = useState<SettingsFormInput>(initialValues);
    const [saving, setSaving] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [logoMeta, setLogoMeta] = useState<{
        originalBytes: number;
        compressedBytes: number;
    } | null>(null);
    const logoInputRef = useRef<HTMLInputElement | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
    }

    async function handleLogoFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        // Reset the input value so picking the same file twice still fires.
        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please choose an image file.", "error");
            return;
        }

        setOptimizing(true);
        try {
            const result = await compressImageToBudget(file, {
                targetBytes: 100 * 1024,
            });
            setForm((prev) => ({ ...prev, logo_url: result.dataUrl }));
            setLogoMeta({
                originalBytes: file.size,
                compressedBytes: result.sizeBytes,
            });
            showToast(
                `Logo optimized: ${formatBytes(file.size)} → ${formatBytes(result.sizeBytes)}.`,
                "success"
            );
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "Could not process image.",
                "error"
            );
        } finally {
            setOptimizing(false);
        }
    }

    function clearLogo() {
        setForm((prev) => ({ ...prev, logo_url: "" }));
        setLogoMeta(null);
    }

    const renderSection = () => {
        switch (activeTab) {
            case "general":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="School Name"
                                placeholder="Eduplexo Academy"
                                value={form.academy_name}
                                onChange={(e) => setForm({ ...form, academy_name: e.target.value })}
                                required
                            />
                            <Input
                                label="Principal Name"
                                placeholder="Dr. John Doe"
                                value={form.principal_name || ""}
                                onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Establishment Year"
                                placeholder="e.g. 1995"
                                value={(form as any).established_year || ""}
                                onChange={(e) => setForm({ ...form, established_year: e.target.value })}
                            />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold normal-case  text-slate-400">Institutional Level</label>
                                <select 
                                    className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all"
                                    value={(form as any).institutional_level || "K-12"}
                                    onChange={(e) => setForm({ ...form, institutional_level: e.target.value } as any)}
                                >
                                    <option value="primary">Primary (K-5)</option>
                                    <option value="secondary">Secondary (6-10)</option>
                                    <option value="high">High School (11-12)</option>
                                    <option value="K-12">K-12 (Comprehensive)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case "contact":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Official Email"
                                type="email"
                                placeholder="info@school.edu"
                                value={form.academy_email}
                                onChange={(e) => setForm({ ...form, academy_email: e.target.value })}
                                required
                            />
                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="+1 234 567 890"
                                value={form.academy_phone || ""}
                                onChange={(e) => setForm({ ...form, academy_phone: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[11px] font-bold text-slate-700 normal-case ">Official Address</label>
                            <textarea
                                placeholder="123 Education St, Knowledge City"
                                value={form.academy_address || ""}
                                onChange={(e) => setForm({ ...form, academy_address: e.target.value })}
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all"
                            />
                        </div>
                    </div>
                );
            case "academic":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold normal-case  text-slate-400">Curriculum Standard</label>
                                <select className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all">
                                    <option>CBSE / National</option>
                                    <option>IB / International Baccalaureate</option>
                                    <option>IGCSE / Cambridge</option>
                                    <option>State Specific Board</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold normal-case  text-slate-400">Primary Language</label>
                                <select className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-600/5 transition-all">
                                    <option>English (Global)</option>
                                    <option>Hindi (National)</option>
                                    <option>Regional Language</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-5 rounded-[2rem] border border-blue-50 bg-blue-50/30 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-bold text-slate-800">Operational Lockdown</p>
                                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Automated attendance sealing after 24-hour window.</p>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-blue-600 relative">
                                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                            </div>
                        </div>
                    </div>
                );
            case "branding":
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept={ACCEPTED_LOGO_TYPES}
                            onChange={handleLogoFile}
                            className="hidden"
                        />

                        {form.logo_url ? (
                            <div className="p-6 rounded-[2rem] border border-slate-200 bg-white flex flex-col md:flex-row items-center gap-6">
                                <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img
                                        src={form.logo_url}
                                        alt="Institutional logo"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0 text-center md:text-left">
                                    <p className="text-sm font-bold text-slate-900">
                                        Institutional logo
                                    </p>
                                    {logoMeta ? (
                                        <p className="text-xs font-medium text-slate-500 mt-1">
                                            Optimized {formatBytes(logoMeta.originalBytes)} →{" "}
                                            <span className="text-emerald-600 font-bold">
                                                {formatBytes(logoMeta.compressedBytes)}
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="text-xs font-medium text-slate-500 mt-1">
                                    
                                        </p>
                                    )}
                                    <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={optimizing}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-bold disabled:opacity-50"
                                        >
                                            Replace logo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearLogo}
                                            disabled={optimizing}
                                            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-bold disabled:opacity-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={optimizing}
                                className="w-full flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition-all group cursor-pointer disabled:cursor-wait disabled:opacity-70"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    {optimizing ? (
                                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                                    ) : (
                                        <AppIcon name="ImagePlus" size={30} className="text-slate-300" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-slate-900">
                                        {optimizing
                                            ? "Optimizing in the background…"
                                            : "Upload Institutional Logo"}
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 mt-1">
                                        Any size accepted. We compress to ~100 KB before saving.
                                    </p>
                                </div>
                            </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 normal-case  block mb-2">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-20 rounded-xl bg-blue-600 border border-slate-200 shadow-sm" />
                                    <input className="flex-1 h-10 border-b border-slate-200 outline-none text-sm font-bold text-slate-700 bg-transparent" defaultValue="#2563EB" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-700 normal-case  block mb-2">Theme Identity</label>
                                <div className="flex gap-2">
                                    <div className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-bold">Dark UI</div>
                                    <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-[11px] font-bold">Light UI</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            {renderSection()}

            <div className="mt-12 flex items-center justify-between pt-6 border-t border-slate-100 sticky bottom-0 bg-white/80 backdrop-blur-md py-4 z-10">
                <div className="flex items-center gap-2 text-emerald-600">
                    <AppIcon name="CloudDone" size={18} />
                    <span className="text-[11px] font-bold normal-case ">All changes staged</span>
                </div>
                <Button
                    type="submit"
                    disabled={saving}
                    className="min-w-[180px] h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all font-bold"
                >
                    {saving ? (
                        <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Synchronizing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <AppIcon name="Save" />
                            Commit Changes
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
