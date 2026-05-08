"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { CreateLiveClassModal } from "../../../components/live-classes/CreateLiveClassModal";
import { LiveClassList } from "../../../components/live-classes/LiveClassList";

export default function LiveClassPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [classesData, setClassesData] = useState<any[]>([]);
    const [subjectsData, setSubjectsData] = useState<any[]>([]);
    const [teachersData, setTeachersData] = useState<any[]>([]);

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const [classesRes, subjectsRes, teachersRes] = await Promise.all([
                    fetch("/api/school/my-classes"),
                    fetch("/api/school/subjects"),
                    fetch("/api/teachers")
                ]);

                if (classesRes.ok) {
                    const data = await classesRes.json();
                    setClassesData(data.data || []);
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

    return (
        <SchoolShell title="Live Classes" eyebrow="Admin">
            <div className="space-y-8">
                <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-8 text-white shadow-2xl shadow-slate-950/20">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">School-wide live teaching</p>
                            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Admin Live Class Console</h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                                Schedule classes for any teacher, publish a Meet link automatically, and let students join from their own live class view.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100/70">Flow</p>
                            <p className="mt-2 text-sm text-slate-200">Admin schedules class -&gt; teacher gets session -&gt; students join -&gt; attendance tracked.</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Active Classes</h3>
                        <p className="mt-3 text-3xl font-black text-sky-700">-</p>
                        <p className="mt-4 text-sm text-slate-500">Live sessions currently running across the school.</p>
                    </div>
                    <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Scheduled Today</h3>
                        <p className="mt-3 text-3xl font-black text-emerald-700">-</p>
                        <p className="mt-4 text-sm text-slate-500">Classes created for today and the upcoming week.</p>
                    </div>
                    <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Teachers Connected</h3>
                        <p className="mt-3 text-3xl font-black text-violet-700">{teachersData.length || "-"}</p>
                        <p className="mt-4 text-sm text-slate-500">Teachers available for live class assignment.</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">School live classes</h2>
                                <p className="mt-1 text-sm text-slate-500">Manage all live sessions from one place.</p>
                            </div>
                            <button
                                onClick={() => setReloadKey((prev) => prev + 1)}
                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Refresh
                            </button>
                        </div>

                        <LiveClassList key={reloadKey} role="ADMIN" />
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
                            <div className="mt-5 space-y-3">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    <span>Schedule Live Class</span>
                                    <span className="material-symbols-outlined text-slate-400">add_circle</span>
                                </button>
                                <Link
                                    href="/admin/teachers"
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    <span>Manage Teachers</span>
                                    <span className="material-symbols-outlined text-slate-400">badge</span>
                                </Link>
                                <Link
                                    href="/admin/timetable"
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    <span>View Timetable</span>
                                    <span className="material-symbols-outlined text-slate-400">schedule</span>
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200/70 bg-indigo-50 p-6 shadow-sm">
                            <div className="mb-3 flex items-center gap-3 text-indigo-700">
                                <span className="material-symbols-outlined">video_call</span>
                                <h2 className="text-lg font-bold">Google Meet setup</h2>
                            </div>
                            <p className="text-sm text-indigo-900">
                                When you schedule a class, the app creates a Google Calendar event with a Meet link and stores it on the live class record.
                            </p>
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