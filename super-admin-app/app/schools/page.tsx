"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { PlatformShell } from "../../layouts/PlatformShell";
import { SchoolsTable } from "../../modules/schools/components/SchoolsTable";
import { ActionModal } from "../../modules/schools/components/ActionModal";

type School = {
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
};

type Modal = {
  type: "approve" | "reject" | "suspend" | "activate" | "delete" | null;
  school: School | null;
};

export default function SchoolsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    status: initialStatus,
    plan: "",
    page: 1,
    limit: 10,
  });

  // Modal state
  const [modal, setModal] = useState<Modal>({ type: null, school: null });

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.status) query.append("status", filters.status);
      if (filters.plan) query.append("plan", filters.plan);
      query.append("page", String(filters.page));
      query.append("limit", String(filters.limit));

      const res = await fetch(`/api/schools?${query.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok && json.data) {
        setSchools(json.data.items || []);
        setTotal(json.data.total || 0);
      } else {
        setError(json.message || "Failed to load schools");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

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
        setModal({ type: null, school: null });
        await loadSchools();
      } else {
        showToast("error", json.message || "Failed to update status");
      }
    } catch (err: any) {
      showToast("error", err.message || "Network error");
    }
  };

  const handleAction = (type: Modal["type"], school: School) => {
    setModal({ type, school });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <PlatformShell eyebrow="Tenant Management" title="All Schools">
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

        {/* Filters Bar */}
        <div className="premium-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search Schools
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full h-9 pl-10 pr-4 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 text-sm font-medium outline-none transition-all"
                />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Plan
              </label>
              <select
                value={filters.plan}
                onChange={(e) => handleFilterChange("plan", e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <button
              onClick={() => loadSchools()}
              className="h-9 px-4 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Status Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "All", value: "" },
            { label: "Pending", value: "pending", color: "amber" },
            { label: "Approved", value: "approved", color: "emerald" },
            { label: "Suspended", value: "suspended", color: "red" },
            { label: "Rejected", value: "rejected", color: "slate" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleFilterChange("status", item.value)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                filters.status === item.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Schools Table */}
        <div className="premium-card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-red-500 text-[48px]">
                error
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2">
                Error Loading Schools
              </h3>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <button
                onClick={loadSchools}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : schools.length === 0 ? (
            <div className="p-16 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-slate-400 text-[32px]">
                  school
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No schools found
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {filters.search || filters.status || filters.plan
                  ? "Try adjusting your filters"
                  : "No schools have been registered yet"}
              </p>
            </div>
          ) : (
            <>
              <SchoolsTable schools={schools} onAction={handleAction} />

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Showing {(filters.page - 1) * filters.limit + 1}-
                    {Math.min(filters.page * filters.limit, total)} of {total}
                  </span>
                  <select
                    value={filters.limit}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        limit: Number(e.target.value),
                        page: 1,
                      }))
                    }
                    className="h-7 px-2 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={filters.page === 1}
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page - 1 }))
                    }
                    className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      chevron_left
                    </span>
                  </button>
                  <span className="px-3 text-[11px] font-bold text-slate-700">
                    Page {filters.page} of {totalPages || 1}
                  </span>
                  <button
                    disabled={filters.page >= totalPages}
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page + 1 }))
                    }
                    className="h-7 w-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {modal.type && modal.school && (
        <ActionModal
          type={modal.type}
          school={modal.school}
          onClose={() => setModal({ type: null, school: null })}
          onConfirm={updateStatus}
        />
      )}
    </PlatformShell>
  );
}
