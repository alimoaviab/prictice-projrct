"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlatformShell } from "../../../layouts/PlatformShell";
import { ActionModal } from "../../../modules/schools/components/ActionModal";

type SchoolDetails = {
  school_id: string;
  name: string;
  code: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  plan?: {
    key?: string;
    seats?: number;
    expires_at?: string;
  };
  usage?: {
    users?: number;
    students?: number;
    teachers?: number;
    classes?: number;
    storage_mb?: number;
  };
  created_at: string;
  approved_at?: string;
  rejection_reason?: string;
};

type ModalType = "approve" | "reject" | "suspend" | "activate" | "delete";

export default function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [school, setSchool] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{ type: ModalType | null }>({ type: null });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadSchool();
  }, [id]);

  const loadSchool = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools?search=${id}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok && json.data?.items?.length > 0) {
        const found = json.data.items.find((s: any) => s.school_id === id) || json.data.items[0];
        setSchool(found);
      } else {
        setError("School not found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const updateStatus = async (
    schoolId: string,
    status: string,
    reason?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/schools/${schoolId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason, notes }),
      });
      const json = await res.json();

      if (json.ok) {
        showToast("success", `School ${status} successfully`);
        setModal({ type: null });
        await loadSchool();
      } else {
        showToast("error", json.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    pending: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: "pending",
      label: "Pending Approval",
    },
    approved: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: "verified",
      label: "Approved & Active",
    },
    rejected: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: "cancel",
      label: "Rejected",
    },
    suspended: {
      bg: "bg-slate-100 border-slate-300",
      text: "text-slate-700",
      icon: "block",
      label: "Suspended",
    },
  };

  if (loading) {
    return (
      <PlatformShell eyebrow="School Details" title="Loading...">
        <div className="space-y-4">
          <div className="h-24 bg-white rounded-xl animate-pulse" />
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </PlatformShell>
    );
  }

  if (error || !school) {
    return (
      <PlatformShell eyebrow="Error" title="School Not Found">
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <span className="material-symbols-outlined text-red-500 text-[48px]">
            error
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-2">
            {error || "School not found"}
          </h3>
          <Link
            href="/schools"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
          >
            ← Back to Schools
          </Link>
        </div>
      </PlatformShell>
    );
  }

  const status = statusConfig[school.status] || statusConfig.pending;

  return (
    <PlatformShell eyebrow="School Management" title={school.name}>
      <div className="space-y-4">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-fade-in ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === "success" ? "check_circle" : "error"}
            </span>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        )}

        {/* Back Button */}
        <Link
          href="/schools"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Schools
        </Link>

        {/* Header Card */}
        <div className="premium-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <span className="text-white text-xl font-bold">
                  {school.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-900">{school.name}</h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${status.bg} ${status.text}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {status.icon}
                    </span>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
                  Code: {school.code}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {school.admin_profile?.email && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">
                        mail
                      </span>
                      {school.admin_profile.email}
                    </div>
                  )}
                  {school.admin_profile?.phone && (
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">
                        phone
                      </span>
                      {school.admin_profile.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {school.status === "pending" && (
                <>
                  <button
                    onClick={() => setModal({ type: "approve" })}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Approve
                  </button>
                  <button
                    onClick={() => setModal({ type: "reject" })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    Reject
                  </button>
                </>
              )}
              {school.status === "approved" && (
                <button
                  onClick={() => setModal({ type: "suspend" })}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">block</span>
                  Suspend
                </button>
              )}
              {school.status === "suspended" && (
                <button
                  onClick={() => setModal({ type: "activate" })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    restart_alt
                  </span>
                  Activate
                </button>
              )}
              {school.status === "rejected" && (
                <button
                  onClick={() => setModal({ type: "approve" })}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Students",
              value: school.usage?.students || 0,
              icon: "groups",
              color: "blue",
            },
            {
              label: "Total Teachers",
              value: school.usage?.teachers || 0,
              icon: "badge",
              color: "purple",
            },
            {
              label: "Total Classes",
              value: school.usage?.classes || 0,
              icon: "meeting_room",
              color: "indigo",
            },
            {
              label: "Storage Used",
              value: `${((school.usage?.storage_mb || 0) / 1024).toFixed(1)} GB`,
              icon: "storage",
              color: "emerald",
            },
          ].map((stat) => (
            <div key={stat.label} className="premium-card p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "purple"
                      ? "bg-purple-50 text-purple-600"
                      : stat.color === "indigo"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {stat.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Two Columns: Info + Subscription */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* School Info */}
          <div className="premium-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">
                info
              </span>
              School Information
            </h3>
            <div className="space-y-3">
              {[
                { label: "School ID", value: school.school_id, mono: true },
                { label: "Code", value: school.code, mono: true },
                { label: "Owner Name", value: school.admin_profile?.name || "—" },
                { label: "Email", value: school.admin_profile?.email || "—" },
                { label: "Phone", value: school.admin_profile?.phone || "—" },
                {
                  label: "Created",
                  value: new Date(school.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
                school.approved_at
                  ? {
                      label: "Approved On",
                      value: new Date(school.approved_at).toLocaleDateString(),
                    }
                  : null,
                school.rejection_reason
                  ? { label: "Rejection Reason", value: school.rejection_reason }
                  : null,
              ]
                .filter(Boolean)
                .map((item: any) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                    <span
                      className={`text-xs text-slate-900 font-semibold text-right ${
                        item.mono ? "font-mono" : ""
                      }`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Subscription */}
          <div className="premium-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-600 text-[18px]">
                workspace_premium
              </span>
              Subscription Details
            </h3>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    Current Plan
                  </p>
                  <p className="text-2xl font-bold text-purple-900 uppercase mt-1">
                    {school.plan?.key || "Free"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-[24px]">
                    workspace_premium
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Seats Available
                </span>
                <span className="text-xs text-slate-900 font-bold">
                  {school.plan?.seats || "Unlimited"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Expires
                </span>
                <span className="text-xs text-slate-900 font-bold">
                  {school.plan?.expires_at
                    ? new Date(school.plan.expires_at).toLocaleDateString()
                    : "No expiry"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </span>
                <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {modal.type && school && (
        <ActionModal
          type={modal.type}
          school={school}
          onClose={() => setModal({ type: null })}
          onConfirm={updateStatus}
        />
      )}
    </PlatformShell>
  );
}
