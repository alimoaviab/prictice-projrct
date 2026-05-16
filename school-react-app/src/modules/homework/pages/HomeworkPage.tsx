/**
 * /admin/homework — Homework dashboard page.
 *
 * Layout (matches the timetable dashboard pattern):
 *   1. Toolbar (search, status filter, "New Assignment" CTA)
 *   2. 4-up summary stat tiles (total, pending, overdue, completed)
 *   3. Assignment cards grid (compact, status-aware, responsive)
 *   4. Proper empty state with onboarding CTA
 *
 * Uses serviceRequest (not raw fetch) so JWT + academic-year headers
 * are always attached.
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StatCardCompact, Skeleton, DataState, ConfirmModal, EntityCard, EntityGrid } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";
import { bindRefresh } from "@/services/data-bus";

interface HomeworkPageProps {
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  studentId?: string;
}

type StatusFilter = "all" | "assigned" | "draft" | "closed";

export function HomeworkPage({ role, studentId }: HomeworkPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  // Track whether we've done the initial load. After that, refetches
  // keep existing data visible (no skeleton flash).
  const hasLoadedOnce = useRef(false);

  const fetchHomeworks = useCallback(async () => {
    if (!hasLoadedOnce.current) {
      setLoading(true);
    }
    try {
      const url =
        role === "PARENT" && studentId
          ? `/api/parent/child/homework?student_id=${studentId}`
          : studentId
            ? `/api/homework?student_id=${studentId}`
            : "/api/homework";

      const res = await serviceRequest<any>(url);
      if (res.ok && res.data) {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.homework_list || res.data.data || [];
        setHomeworks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("[HomeworkPage] fetch error:", error);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [role, studentId]);

  useEffect(() => {
    fetchHomeworks();
    return bindRefresh("homework", fetchHomeworks);
  }, [fetchHomeworks]);

  // ─── Derived data ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = homeworks;
    if (statusFilter !== "all") {
      list = list.filter((hw) => hw.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (hw) =>
          hw.title?.toLowerCase().includes(q) ||
          hw.subject_name?.toLowerCase().includes(q) ||
          hw.subject?.toLowerCase().includes(q) ||
          hw.class_name?.toLowerCase().includes(q) ||
          hw.teacher_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [homeworks, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = homeworks.length;
    const assigned = homeworks.filter((h) => h.status === "assigned").length;
    const draft = homeworks.filter((h) => h.status === "draft").length;
    const closed = homeworks.filter((h) => h.status === "closed").length;
    const now = new Date();
    const overdue = homeworks.filter((h) => {
      if (h.status !== "assigned") return false;
      const due = new Date(h.due_at || h.due_date);
      return due < now;
    }).length;
    return { total, assigned, draft, closed, overdue };
  }, [homeworks]);

  // ─── Actions ───────────────────────────────────────────────────────────

  const canCreate = role === "ADMIN" || role === "TEACHER";
  const createPath = role === "ADMIN" ? "/admin/homework/create" : "/teacher/homework/create";
  const basePath =
    role === "ADMIN"
      ? "/admin/homework"
      : role === "TEACHER"
        ? "/teacher/homework"
        : role === "PARENT"
          ? "/parent/homework"
          : "/student/homework";

  async function handleDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete._id || pendingDelete.id;
    const res = await serviceRequest<any>(`/api/homework/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Assignment deleted.", "success");
      fetchHomeworks();
    } else {
      showToast(res.error?.message || "Failed to delete.", "error");
    }
    setPendingDelete(null);
  }

  function formatDate(value?: string) {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return value;
    }
  }

  function isOverdue(hw: any): boolean {
    if (hw.status !== "assigned") return false;
    const due = new Date(hw.due_at || hw.due_date);
    return due < new Date();
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Summary Stats ────────────────────────────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCardCompact
            label="Total Assignments"
            value={stats.total}
            icon="assignment"
            accent="blue"
          />
          <StatCardCompact
            label="Active / Pending"
            value={stats.assigned}
            icon="pending_actions"
            accent="purple"
            hint={stats.overdue > 0 ? `${stats.overdue} overdue` : "All on track"}
          />
          <StatCardCompact
            label="Drafts"
            value={stats.draft}
            icon="edit_note"
            accent="amber"
            hint="Not yet published"
          />
          <StatCardCompact
            label="Completed"
            value={stats.closed}
            icon="task_alt"
            accent="emerald"
            hint="Closed assignments"
          />
        </div>
      )}

      {/* ─── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 px-4 py-3 shadow-[0_4px_18px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 shadow-sm shadow-blue-600/15">
            <span className="material-symbols-outlined text-lg">assignment</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 normal-case truncate">
              Assignments · {stats.total} total
            </p>
            <p className="text-[13px] font-bold text-slate-900 tracking-tight">
              Homework Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="h-8 w-[180px] rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[12px] font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
            />
          </div>

          {/* Status filter */}
          <div className="inline-flex items-center bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            {(["all", "assigned", "draft", "closed"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-colors capitalize ${statusFilter === s
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Create CTA */}
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate(createPath)}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base">add</span>
              New assignment
            </button>
          )}
        </div>
      </div>

      {/* ─── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* ─── Empty State ──────────────────────────────────────────────── */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 ring-1 ring-slate-900/5 shadow-[0_4px_18px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
            <div className="px-6 py-8 md:px-8 md:py-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <span className="material-symbols-outlined text-xl">assignment</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {searchQuery || statusFilter !== "all"
                  ? "No assignments match your filters"
                  : "No homework assigned yet"}
              </h3>
              <p className="mt-1.5 text-[13px] leading-6 text-slate-500 max-w-xl font-medium">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or status filter to find what you're looking for."
                  : "Create your first assignment and it will appear here. Students see it in their portal immediately."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                {canCreate && !searchQuery && statusFilter === "all" && (
                  <button
                    type="button"
                    onClick={() => navigate(createPath)}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-600/15 hover:bg-blue-700 transition-colors active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Create first assignment
                  </button>
                )}
                {(searchQuery || statusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">filter_alt_off</span>
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Side guidance */}
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/40 px-5 py-6">
              <p className="text-[10px] font-bold text-slate-400 normal-case mb-3">Quick tips</p>
              <ul className="space-y-2.5">
                {[
                  { icon: "school", text: "Pick a class and subject" },
                  { icon: "calendar_today", text: "Set a due date" },
                  { icon: "person", text: "Assign a teacher" },
                  { icon: "send", text: "Publish — students see it instantly" },
                ].map((tip) => (
                  <li key={tip.icon} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base text-blue-500 mt-0.5">
                      {tip.icon}
                    </span>
                    <span className="text-[12px] font-medium text-slate-600">{tip.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── Assignment Cards Grid ────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <EntityGrid>
          {filtered.map((hw) => {
            const id = hw._id || hw.id;
            const overdue = isOverdue(hw);
            const accent: "rose" | "blue" | "amber" | "emerald" = overdue
              ? "rose"
              : hw.status === "draft"
                ? "amber"
                : hw.status === "closed"
                  ? "emerald"
                  : "blue";
            const statusLabel = overdue ? "Overdue" : hw.status || "assigned";

            return (
              <EntityCard
                key={id}
                icon="assignment"
                accent={accent}
                title={hw.title}
                subtitle={hw.subject_name || hw.subject}
                status={{ label: statusLabel, accent }}
                hoverActions={[
                  {
                    label: "View submissions",
                    icon: "visibility",
                    onClick: () => navigate(`${basePath}/${id}/review`),
                    accent: "blue",
                  },
                  ...(canCreate
                    ? ([
                        {
                          label: "Edit",
                          icon: "edit",
                          onClick: () =>
                            navigate(
                              `${role === "ADMIN" ? "/admin" : "/teacher"}/homework/edit/${id}`
                            ),
                          accent: "blue" as const,
                        },
                        {
                          label: "Delete",
                          icon: "delete",
                          onClick: () => setPendingDelete(hw),
                          accent: "rose" as const,
                        },
                      ])
                    : []),
                ]}
                metrics={[
                  { label: "Class", value: hw.class_name || "—" },
                  { label: "Due", value: formatDate(hw.due_at || hw.due_date) },
                ]}
                context={{
                  label: hw.teacher_name || "Instructor",
                  icon: (
                    <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                      {(hw.teacher_name || "T").charAt(0).toUpperCase()}
                    </div>
                  ),
                  to: `${basePath}/${id}/review`,
                }}
                actions={[
                  {
                    label: "Open",
                    icon: "visibility",
                    to: `${basePath}/${id}/review`,
                    accent: "blue",
                    primary: true,
                  },
                ]}
              />
            );
          })}
        </EntityGrid>
      )}

      {/* ─── Delete Confirm ───────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={pendingDelete !== null}
        title="Delete this assignment?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently removed. Student submissions will be lost.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
