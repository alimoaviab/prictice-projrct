"use client";

import { useEffect, useState } from "react";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { DataState, Skeleton } from "../../../components/ui";
import { serviceRequest } from "../../../services/service-client";
import { useSelectedChild } from "../../../contexts/SelectedChildContext";

type FeesResponse = {
    student: string;
    class: string;
    academic_year: string;
    fee_summary: {
        total_fee: number;
        collected: number;
        pending: number;
        percentage_paid: number;
        status: string;
    };
    fee_details: Array<{
        fee_type: string;
        amount: number;
        due_date: string;
        status: string;
        payment_date: string | null;
        receipt_no: string | null;
    }>;
    payment_history: Array<{
        receipt_no: string;
        date: string;
        amount: number;
        fee_type: string;
        method: string;
        status: string;
    }>;
};

export default function ParentFeesPage() {
    const { selectedChild, loading: childLoading } = useSelectedChild();
    const [data, setData] = useState<FeesResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedChild) return;
        
        async function fetchData() {
            setLoading(true);
            try {
                if (!selectedChild) return;
                const res = await serviceRequest<FeesResponse>(`/api/parent/fees?student_id=${selectedChild.student_id}`);
                if (res.ok && res.data) {
                    setData(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch fees:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [selectedChild]);

    if (childLoading || (loading && !data)) {
        return (
            <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full rounded-2xl" />
                    <Skeleton className="h-64 w-full rounded-2xl" />
                </div>
            </SchoolShell>
        );
    }

    if (!selectedChild || !data) {
        return (
            <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
                <DataState variant="empty" title="No Records" message="No fee information found for the selected student." />
            </SchoolShell>
        );
    }

    return (
        <SchoolShell eyebrow="Guardian Portal" title="Fee Statement">
            <div className="space-y-6">
                {/* Financial Summary */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Financial Overview</p>
                           <h2 className="text-xl font-black text-slate-900 tracking-tight">Ledger Summary</h2>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${
                           data.fee_summary.pending > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                           Status: {data.fee_summary.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Payble", value: data.fee_summary.total_fee, icon: "account_balance" },
                            { label: "Total Paid", value: data.fee_summary.collected, icon: "payments" },
                            { label: "Outstanding", value: data.fee_summary.pending, icon: "pending_actions", highlight: true },
                            { label: "Recovery Rate", value: `${data.fee_summary.percentage_paid}%`, icon: "trending_up", isRaw: true }
                        ].map(m => (
                            <div key={m.label} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{m.label}</p>
                               <p className={`text-lg font-black ${m.highlight ? 'text-blue-600' : 'text-slate-900'}`}>
                                 {m.isRaw ? m.value : `Rs. ${m.value.toLocaleString()}`}
                               </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fee Components */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                           <h3 className="text-[13px] font-black text-slate-900 tracking-tight">Fee Components</h3>
                           <span className="material-symbols-outlined text-slate-300">receipt_long</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {data.fee_details.map((fee) => (
                                <div key={`${fee.fee_type}-${fee.due_date}`} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-800">{fee.fee_type}</p>
                                        <p className="text-[9px] font-medium text-slate-400 mt-0.5">Due: {fee.due_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black text-slate-900">Rs. {fee.amount.toLocaleString()}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                                           fee.status === 'paid' ? 'text-blue-600' : 'text-amber-500'
                                        }`}>{fee.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                           <h3 className="text-[13px] font-black text-slate-900 tracking-tight">Payment History</h3>
                           <span className="material-symbols-outlined text-slate-300">history</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {data.payment_history.length > 0 ? data.payment_history.map((payment) => (
                                <div key={payment.receipt_no} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                           <span className="material-symbols-outlined text-[18px]">verified</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800">{payment.receipt_no}</p>
                                            <p className="text-[9px] font-medium text-slate-400">{payment.date} · {payment.method}</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-blue-600">Rs. {payment.amount.toLocaleString()}</p>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 text-xs">No payments recorded yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SchoolShell>
    );
}
