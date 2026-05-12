"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { serviceRequest } from "../../../services/service-client";

type ClassWithFees = {
    _id: string;
    name: string;
    section: string;
    academic_year: string;
    total_students: number;
    monthly_fee: number;
    collected_this_month: number;
    pending_amount: number;
    defaulters_count: number;
    recurring_components: number;
    onetime_components: number;
    collection_percentage: number;
};

type FeeDashboardStats = {
    monthly_collection: {
        total: number;
        growth_percentage: number;
        paid_vs_pending_ratio: string;
    };
    defaulters: {
        count: number;
        overdue_amount: number;
        high_priority: number;
    };
    collection_progress: {
        paid_percentage: number;
        remaining_percentage: number;
    };
    active_components: {
        recurring: number;
        onetime: number;
        active_classes: number;
    };
};

function money(value: number) {
    return `Rs ${value.toLocaleString()}`;
}

export default function FeePage() {
    const router = useRouter();
    const [stats, setStats] = useState<FeeDashboardStats | null>(null);
    const [classes, setClasses] = useState<ClassWithFees[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        void (async () => {
            try {
                const [statsRes, classesRes] = await Promise.all([
                    serviceRequest<FeeDashboardStats>("/api/school/fees/dashboard-stats"),
                    serviceRequest<{ classes: ClassWithFees[] }>("/api/school/fees/classes-summary"),
                ]);

                if (cancelled) return;

                if (!statsRes.ok) throw new Error(statsRes.error.message || "Failed to load dashboard stats");
                if (!classesRes.ok) throw new Error(classesRes.error.message || "Failed to load classes");

                setStats(statsRes.data);
                setClasses(classesRes.data?.classes ?? []);
            } catch (caught) {
                if (!cancelled) setError(caught instanceof Error ? caught.message : "Unable to load fee dashboard");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return (
        <SchoolShell title="Fee Management" eyebrow="Finance">
            <div className="space-y-6 pb-10">
                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                        </div>
                    </div>
                ) : error ? (
                    <DataState variant="error" title="Fee dashboard unavailable" message={error} />
                ) : (
                    <>
                        {/* COMPACT PROFESSIONAL STATS - 4 CARDS ONLY */}
                        <div className="grid grid-cols-4 gap-4">
                            {/* CARD 1: Monthly Collection */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Monthly Collection</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{money(stats?.monthly_collection?.total ?? 0)}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`text-xs font-bold ${(stats?.monthly_collection?.growth_percentage ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {(stats?.monthly_collection?.growth_percentage ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.monthly_collection?.growth_percentage ?? 0)}%
                                            </span>
                                            <span className="text-xs text-slate-500">{stats?.monthly_collection?.paid_vs_pending_ratio ?? '0:0'}</span>
                                        </div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                        <span className="material-symbols-outlined text-[20px] text-blue-600">payments</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: Defaulters */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Defaulters</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{stats?.defaulters?.count ?? 0}</p>
                                        <div className="mt-2 space-y-0.5">
                                            <p className="text-xs font-semibold text-red-600">{money(stats?.defaulters?.overdue_amount ?? 0)} overdue</p>
                                            <p className="text-xs text-slate-500">{stats?.defaulters?.high_priority ?? 0} high priority</p>
                                        </div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                                        <span className="material-symbols-outlined text-[20px] text-red-600">warning</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 3: Collection Progress */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Collection Progress</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{stats?.collection_progress?.paid_percentage ?? 0}%</p>
                                        <div className="mt-2">
                                            <div className="h-2 w-full rounded-full bg-slate-100">
                                                <div 
                                                    className="h-full rounded-full bg-emerald-500" 
                                                    style={{ width: `${stats?.collection_progress?.paid_percentage ?? 0}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">{stats?.collection_progress?.remaining_percentage ?? 0}% remaining</p>
                                        </div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                                        <span className="material-symbols-outlined text-[20px] text-emerald-600">analytics</span>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 4: Active Components */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Components</p>
                                        <p className="mt-1 text-2xl font-black text-slate-900">{(stats?.active_components?.recurring ?? 0) + (stats?.active_components?.onetime ?? 0)}</p>
                                        <div className="mt-2 space-y-0.5">
                                            <p className="text-xs text-slate-600">{stats?.active_components?.recurring ?? 0} recurring</p>
                                            <p className="text-xs text-slate-500">{stats?.active_components?.active_classes ?? 0} classes</p>
                                        </div>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                                        <span className="material-symbols-outlined text-[20px] text-violet-600">receipt_long</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CLASS CARDS GRID - PROFESSIONAL ACCOUNTING LAYOUT */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-black text-slate-900">Class Fee Management</h2>
                                <button
                                    type="button"
                                    onClick={() => router.push("/admin/classes")}
                                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Add Class
                                </button>
                            </div>

                            {classes.length === 0 ? (
                                <DataState
                                    variant="empty"
                                    title="No classes found"
                                    message="Create classes to start managing fees"
                                />
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {classes.map((classItem) => (
                                        <div key={classItem._id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md">
                                            {/* Class Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-black text-slate-900">{classItem.name}</h3>
                                                    <p className="text-xs text-slate-500">{classItem.academic_year}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => router.push(`/admin/classes/${classItem._id}/edit`)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                                        title="Edit Class"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                                        title="Print Fee Structure"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">print</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Accounting Metrics */}
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-xl bg-slate-50 p-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Students</p>
                                                    <p className="mt-0.5 text-lg font-black text-slate-900">{classItem.total_students}</p>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 p-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Monthly Fee</p>
                                                    <p className="mt-0.5 text-lg font-black text-slate-900">{money(classItem.monthly_fee)}</p>
                                                </div>
                                                <div className="rounded-xl bg-emerald-50 p-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Collected</p>
                                                    <p className="mt-0.5 text-lg font-black text-emerald-700">{money(classItem.collected_this_month)}</p>
                                                </div>
                                                <div className="rounded-xl bg-amber-50 p-2.5">
                                                    <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Pending</p>
                                                    <p className="mt-0.5 text-lg font-black text-amber-700">{money(classItem.pending_amount)}</p>
                                                </div>
                                            </div>

                                            {/* Fee Components Summary */}
                                            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="font-semibold text-slate-600">{classItem.recurring_components} recurring</span>
                                                    <span className="font-semibold text-slate-600">{classItem.onetime_components} one-time</span>
                                                </div>
                                                {classItem.defaulters_count > 0 && (
                                                    <span className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                                        {classItem.defaulters_count} defaulters
                                                    </span>
                                                )}
                                            </div>

                                            {/* Primary Action Button */}
                                            <button
                                                type="button"
                                                onClick={() => router.push(`/admin/classes/${classItem._id}/fees`)}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                                Manage Fees
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </SchoolShell>
    );
}
