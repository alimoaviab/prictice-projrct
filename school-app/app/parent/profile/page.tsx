"use client";

import { useEffect, useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { DataState, Skeleton } from "../../../components/ui";
import { serviceRequest } from "../../../services/service-client";
import { useSelectedChild } from "../../../contexts/SelectedChildContext";

type ProfileResponse = {
    student: {
        id: string;
        name: string;
        roll_no: string;
        email: string;
        phone: string;
        date_of_birth: string | null;
        class: string;
        section: string;
        academic_year: string;
        status: string;
    };
    guardian: {
        name: string;
        relationship: string;
        phone: string;
        email: string;
    };
    enrolled_subjects: Array<{ id: string; name: string; code?: string }>;
};

export default function ParentStudentProfilePage() {
    const { selectedChild, loading: childLoading } = useSelectedChild();
    const [data, setData] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedChild) return;
        
        async function fetchData() {
            setLoading(true);
            try {
                if (!selectedChild) return;
                const res = await serviceRequest<ProfileResponse>(`/api/parent/student-info?student_id=${selectedChild.student_id}`);
                if (res.ok && res.data) {
                    setData(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [selectedChild]);

    if (childLoading || (loading && !data)) {
        return (
            <SchoolShell eyebrow="Guardian Portal" title="Ward Profile">
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </SchoolShell>
        );
    }

    if (!selectedChild || !data) {
        return (
            <SchoolShell eyebrow="Guardian Portal" title="Ward Profile">
                <DataState variant="empty" title="No Records" message="No profile information found for the selected student." />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell eyebrow="Guardian Portal" title="Ward Profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Identity Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-600/20">
                                    {data.student.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data.student.name}</h2>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{data.student.class} {data.student.section ? `- ${data.student.section}` : ""}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                                {data.student.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: "Admission / Roll No", value: data.student.roll_no, icon: "badge" },
                                { label: "Academic Session", value: data.student.academic_year, icon: "calendar_today" },
                                { label: "Institutional Email", value: data.student.email, icon: "alternate_email" },
                                { label: "Contact Registry", value: data.student.phone || "—", icon: "phone_enabled" },
                                { label: "Date of Birth", value: data.student.date_of_birth || "—", icon: "cake" }
                            ].map(m => (
                                <div key={m.label} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/30 flex items-center gap-3">
                                   <span className="material-symbols-outlined text-[18px] text-blue-600 opacity-30">{m.icon}</span>
                                   <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{m.label}</p>
                                      <p className="text-[11px] font-bold text-slate-800 truncate">{m.value}</p>
                                   </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h3 className="text-[13px] font-black text-slate-900 tracking-tight mb-4">Academic Curriculum</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.enrolled_subjects.map((subject) => (
                                <div key={subject.id} className="px-3 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100/50 flex flex-col">
                                   <span className="text-[8px] font-black text-blue-600/60 uppercase tracking-tighter">{subject.code || 'SUB'}</span>
                                   <span className="text-[11px] font-black text-slate-700">{subject.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Secondary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                           <span className="material-symbols-outlined text-blue-600 text-[18px]">family_restroom</span>
                           <h3 className="text-[13px] font-black text-slate-900 tracking-tight uppercase tracking-widest">Guardian Info</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: "Full Name", value: data.guardian.name || "—" },
                                { label: "Relationship", value: data.guardian.relationship },
                                { label: "Phone", value: data.guardian.phone || "—" },
                                { label: "Email", value: data.guardian.email || "—" }
                            ].map(m => (
                                <div key={m.label} className="flex flex-col gap-1">
                                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{m.label}</span>
                                   <span className="text-[11px] font-bold text-slate-800">{m.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                       <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">Privacy & Security</p>
                          <p className="text-[11px] font-bold leading-relaxed opacity-80">This data is strictly isolated to your verified guardian account. Any discrepancy should be reported to the administration.</p>
                       </div>
                       <span className="material-symbols-outlined absolute right-[-10px] bottom-[-10px] text-[60px] text-white opacity-5">security</span>
                    </div>
                </div>
            </div>
        </SchoolShell>
    );
}
