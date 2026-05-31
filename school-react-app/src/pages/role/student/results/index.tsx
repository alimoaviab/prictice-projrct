import { AppIcon } from "shared/ui/AppIcon";
/**
 * Student Results — premium redesign with real Print Marksheet actions.
 *
 *   - Page-level "Print Class Marksheet" button → calls
 *     `exportExamMarksheet` to print every visible row in one branded
 *     class transcript.
 *   - Per-row "Print" button → calls `exportMarksheet` to print a single
 *     student transcript.
 *
 * Both helpers come from @/utils/marksheet (the same utility the admin /
 * teacher results pages already use), so the printed documents look and
 * feel exactly like the rest of the school's official paperwork.
 *
 * The data fetch contract is unchanged — same `useResults` hook with the
 * `student_id` filter the previous wrapper used.
 */

import { useEffect, useMemo, useState } from "react";

import { DataState, Skeleton, StatCardCompact } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useResults } from "@/modules/results/hooks/useResults";
import type { ResultRow } from "@/modules/results/types/result.types";
import { exportMarksheet, exportExamMarksheet } from "@/utils/marksheet";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";

// ────────────────────────────────────────────────────────────────────────
// Helpers — student id resolution mirrors the fees page so the page works
// for users whose JWT didn't already carry `studentId`.
// ────────────────────────────────────────────────────────────────────────

async function resolveStudentId(studentId?: string) {
  if (studentId) return studentId;
  const result = await serviceRequest<{ students: Array<{ id: string }> }>(
    "/api/parent/student-info",
  );
  return result.ok ? result.data.students?.[0]?.id ?? "" : "";
}

function gradeTone(grade: string) {
  const g = (grade || "").toUpperCase();
  if (g === "F") return "bg-rose-50 text-rose-600 border-rose-100";
  if (g === "D") return "bg-amber-50 text-amber-600 border-amber-100";
  if (g === "A+" || g === "A") return "bg-emerald-50 text-emerald-600 border-emerald-100";
  return "bg-blue-50 text-blue-600 border-blue-100";
}

function ratioPct(row: ResultRow): number {
  if (typeof row.percentage === "number") return Math.round(row.percentage);
  if (row.max_marks > 0)
    return Math.round((row.obtained_marks / row.max_marks) * 100);
  return 0;
}

// ────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────

export function StudentResultsPage() {
  const { user } = useAuth();

  // Lazily resolve the student id once on mount (covers parents whose
  // children's id wasn't on the JWT).
  const [studentId, setStudentId] = useState<string | undefined>(
    user?.studentId,
  );

  useEffect(() => {
    if (studentId) return;
    let cancelled = false;
    void (async () => {
      const id = await resolveStudentId(user?.studentId);
      if (!cancelled && id) setStudentId(id);
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, user?.studentId]);

  const { state } = useResults(studentId ? { student_id: studentId } : undefined);

  const { schoolName, logoUrl } = useSchoolBranding();
  const brandedSchoolName = schoolName || "School";
  const principal =
    (user as unknown as { principal?: string })?.principal ||
    "Authorized Signatory";

  // ────────────────────────────────────────────────────────────────────
  // Derived stats
  // ────────────────────────────────────────────────────────────────────

  const rows: ResultRow[] = useMemo(() => {
    if (state.status === "success" && Array.isArray(state.data))
      return state.data;
    return [];
  }, [state]);

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return {
        total: 0,
        avgPercent: 0,
        bestGrade: "—",
        latestGrade: "—",
        passed: 0,
      };
    }
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime(),
    );
    const totalPct = rows.reduce((acc, r) => acc + ratioPct(r), 0);
    const avgPercent = Math.round(totalPct / rows.length);
    // "Best" — pick the row with the highest percentage so the badge
    // reflects an actual exam, not a manufactured score.
    const best = [...rows].sort((a, b) => ratioPct(b) - ratioPct(a))[0];
    const passed = rows.filter(
      (r) => (r.grade || "").toUpperCase() !== "F",
    ).length;
    return {
      total: rows.length,
      avgPercent,
      bestGrade: best?.grade || "—",
      latestGrade: sorted[0]?.grade || "—",
      passed,
    };
  }, [rows]);

  const headerStudentName = rows[0]?.student_name || "Student";
  const headerClass = rows[0]?.class_name || "";

  // ────────────────────────────────────────────────────────────────────
  // States
  // ────────────────────────────────────────────────────────────────────

  if (state.status === "idle" || state.status === "loading") {
    return (
      <SchoolShell eyebrow="Student Portal" title="Exam Results">
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[80px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Student Portal" title="Exam Results">
        <DataState
          variant="error"
          title="Results unavailable"
          message={state.error}
        />
      </SchoolShell>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Print actions
  // ────────────────────────────────────────────────────────────────────

  function handlePrintRow(row: ResultRow) {
    exportMarksheet(row, { schoolName: brandedSchoolName, logoUrl, principal });
    showToast("Generating marksheet…", "info");
  }

  function handlePrintAll() {
    if (rows.length === 0) return;
    exportExamMarksheet(rows, { schoolName: brandedSchoolName, logoUrl, principal });
    showToast("Generating combined marksheet…", "info");
  }

  // ────────────────────────────────────────────────────────────────────
  return (
    <SchoolShell eyebrow="Student Portal" title="Exam Results">
      {/* ── Hero strip ─────────────────────────────────────────────── */}
      <div className="mb-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[9px] font-black text-blue-600 uppercase tracking-wider border border-blue-100">
              Academic Performance
            </span>
            {rows.length > 0 ? (
              <span
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${gradeTone(
                  stats.latestGrade,
                )}`}
              >
                Latest: {stats.latestGrade}
              </span>
            ) : null}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {headerStudentName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            {headerClass ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="GraduationCap" size={14} />
                <span className="text-[11px] font-bold">{headerClass}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-slate-500">
              <AppIcon name="Leaderboard" size={14} />
              <span className="text-[11px] font-bold">
                {rows.length} exam{rows.length === 1 ? "" : "s"} graded
              </span>
            </div>
            {rows.length > 0 ? (
              <div className="flex items-center gap-1.5 text-slate-500">
                <AppIcon name="TrendingUp" size={14} />
                <span className="text-[11px] font-bold">
                  {stats.avgPercent}% average
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {rows.length > 0 ? (
          <button
            type="button"
            onClick={handlePrintAll}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm no-print"
          >
            <AppIcon name="Printer" size={16} />
            Print Combined Marksheet
          </button>
        ) : null}

        <AppIcon name="Leaderboard" size={120} className="absolute right-[-10px] bottom-[-20px] text-slate-50 opacity-50 select-none pointer-events-none" />
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {rows.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCardCompact
            label="Exams Graded"
            value={stats.total}
            icon="quiz"
            accent="blue"
            hint="Across all subjects"
          />
          <StatCardCompact
            label="Average"
            value={`${stats.avgPercent}%`}
            icon="trending_up"
            accent="emerald"
            hint="Overall percentage"
          />
          <StatCardCompact
            label="Best Grade"
            value={stats.bestGrade}
            icon="emoji_events"
            accent="amber"
            hint="Top result on record"
          />
          <StatCardCompact
            label="Passed"
            value={`${stats.passed}/${stats.total}`}
            icon="task_alt"
            accent={stats.passed === stats.total ? "emerald" : "rose"}
            hint={
              stats.passed === stats.total ? "Clean record" : "Keep going"
            }
          />
        </div>
      ) : null}

      {/* ── Body: per-exam list ─────────────────────────────────────── */}
      {rows.length === 0 ? (
        <PremiumEmpty
          title="No published results yet"
          message="Results for your exams will appear here as soon as your school publishes them."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((row) => {
            const pct = ratioPct(row);
            const tone = gradeTone(row.grade);
            return (
              <div
                key={row._id}
                className="premium-card p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-900 leading-tight truncate">
                      {row.exam_title}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                      {(() => {
                        const count = row.subjects && row.subjects.length > 0
                          ? row.subjects.length
                          : (row.exam_subject ? row.exam_subject.split(",").filter(s => s.trim()).length : 0);
                        return `${count} ${count === 1 ? "subject" : "subjects"}`;
                      })()}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {new Date(row.graded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${tone}`}
                  >
                    {row.grade || "—"}
                  </span>
                </div>

                {/* Marks bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500">
                      {row.obtained_marks} / {row.max_marks}
                    </span>
                    <span className="text-[10px] font-black text-slate-700 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        pct >= 80
                          ? "bg-emerald-500"
                          : pct >= 50
                            ? "bg-blue-500"
                            : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>

                {/* Per-subject breakdown if present */}
                {row.subjects && row.subjects.length > 0 ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/30 p-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Subjects
                    </p>
                    <div className="space-y-1">
                      {row.subjects.slice(0, 4).map((s, idx) => (
                        <div
                          key={`${row._id}-sub-${idx}`}
                          className="flex items-center justify-between text-[10px]"
                        >
                          <span className="font-bold text-slate-700 truncate pr-2">
                            {(s as { subject_name?: string }).subject_name ||
                              "—"}
                          </span>
                          <span className="font-black tabular-nums text-slate-600">
                            {(s as { obtained_marks?: number })
                              .obtained_marks ?? 0}{" "}
                            /{" "}
                            {(s as { max_marks?: number }).max_marks ?? 0}
                          </span>
                        </div>
                      ))}
                      {row.subjects.length > 4 ? (
                        <p className="text-[9px] font-medium text-slate-400 mt-1">
                          + {row.subjects.length - 4} more on the marksheet
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {row.remarks ? (
                  <p className="text-[10px] font-medium text-slate-500 italic">
                    “{row.remarks}”
                  </p>
                ) : null}

                <div className="flex items-center justify-end gap-2 mt-auto">
                  <button
                    type="button"
                    onClick={() => handlePrintRow(row)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm no-print"
                  >
                    <AppIcon name="Printer" size={14} />
                    Print Marksheet
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SchoolShell>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function PremiumEmpty({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center flex flex-col items-center justify-center">
      <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
        <AppIcon name="Leaderboard" size={24} className="text-slate-300" />
      </div>
      <p className="text-[13px] font-black text-slate-700">{title}</p>
      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">{message}</p>
    </div>
  );
}
