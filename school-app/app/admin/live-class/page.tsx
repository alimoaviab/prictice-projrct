"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { CreateLiveClassModal } from "../../../components/live-classes/CreateLiveClassModal";
import { LiveClassList } from "../../../components/live-classes/LiveClassList";
import { Video, Calendar, Users, RefreshCw, PlusCircle, LayoutDashboard, Clock, Activity, Settings, UserCheck } from "lucide-react";

export default function LiveClassPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [classesData, setClassesData] = useState<any[]>([]);
    const [subjectsData, setSubjectsData] = useState<any[]>([]);
    const [teachersData, setTeachersData] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const [classesRes, subjectsRes, teachersRes, liveRes] = await Promise.all([
                    fetch("/api/school/my-classes"),
                    fetch("/api/school/subjects"),
                    fetch("/api/teachers"),
                    fetch("/api/live/classes") // fetch live separately to get accurate counts
                ]);

                if (classesRes.ok) {
                    const data = await classesRes.json();
                    setClassesData(data.classes || []);
                }

                if (subjectsRes.ok) {
                    const data = await subjectsRes.json();
                    setSubjectsData(data.data || []);
                }

                if (teachersRes.ok) {
                    const data = await teachersRes.json();
                    setTeachersData(data.data || []);
                }
            } catch (error) {
                console.error("Failed to load live class form data", error);
            }
        };

        loadFormData();
    }, []);

    // Simulate sync
    const handleSync = () => {
      setIsSyncing(true);
      setTimeout(() => {
        setReloadKey(prev => prev + 1);
        setIsSyncing(false);
      }, 800);
    };

    return (
        <SchoolShell title="Live Classes" eyebrow="Operations Center">
            <div className="space-y-6 max-w-7xl mx-auto pb-12">

                {/* 1. TOP LIVE CONTROL BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                           <Activity className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900">Live Operations Control</h1>
                                <span className="relative flex h-2.5 w-2.5 ml-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSync}
                            className={`p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all ${isSyncing ? 'bg-slate-50 opacity-70' : ''}`}
                            title="Sync Data"
                        >
                            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Schedule Session
                        </button>
                    </div>
                </div>

                {/* 2. LIVE SESSION DASHBOARD (Compact Metrics) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-red-50 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Live</h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900">0</p>
                                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center">
                                       <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></span>
                                       Live
                                    </span>
                                </div>
                            </div>
                            <Video className="h-5 w-5 text-red-400" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-blue-50 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Queued Today</h3>
                                <p className="mt-2 text-3xl font-black text-slate-900">-</p>
                            </div>
                            <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-emerald-50 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Teachers Ready</h3>
                                <p className="mt-2 text-3xl font-black text-slate-900">{teachersData.length || "-"}</p>
                            </div>
                            <Users className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 h-16 w-16 -mr-4 -mt-4 rounded-full bg-amber-50 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Duration</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <p className="text-3xl font-black text-slate-900">45</p>
                                    <span className="text-sm font-semibold text-slate-500">min</span>
                                </div>
                            </div>
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* 3. MAIN LAYOUT (Timeline Left, Tools Right) */}
                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

                    {/* LEFT COLUMN: Timeline */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
                        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Session Feed</h2>
                            </div>
                        </div>

                        <LiveClassList key={reloadKey} role="ADMIN" />
                    </div>

                    {/* RIGHT COLUMN: Tools & Actions */}
                    <div className="space-y-6">

                        {/* Quick Actions Panel */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Workspace Tools</h2>
                            <div className="space-y-2">
                                <Link
                                    href="/admin/teachers"
                                    className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        <span>Assign Teachers</span>
                                    </div>
                                </Link>
                                <Link
                                    href="/admin/timetable"
                                    className="group flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        <span>Master Timetable</span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Integration Status Panel */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                            <div className="bg-slate-900 p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white">
                                        <Video className="h-5 w-5 text-indigo-400" />
                                        <h2 className="text-sm font-bold">Meet Integration</h2>
                                    </div>
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Auto-Generation</span>
                                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">Active</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Calendar Sync</span>
                                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">Connected</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Session links are automatically generated via Google Workspace API upon scheduling.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Live Attendance Tracking (Mock) */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <UserCheck className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Live Attendance</h2>
                            </div>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                                <p className="text-sm text-slate-500 font-medium mb-2">No active tracking</p>
                                <p className="text-xs text-slate-400">Start a live session to monitor student join rates in real-time.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <CreateLiveClassModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setReloadKey((prev) => prev + 1)}
                classes={classesData}
                subjects={subjectsData}
                teachers={teachersData}
                showTeacherField={true}
            />
        </SchoolShell>
    );
}