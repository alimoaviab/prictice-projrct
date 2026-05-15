/**
 * Group marks entry — one wide table for the whole exam (all subjects).
 *
 * Architecture: each exam owns a subjects[] array. Each student gets
 * ONE result row per exam containing a parallel subjects[] breakdown.
 * The save endpoint upserts by (exam_id, student_id) so reopening this
 * page never creates duplicate rows.
 *
 * Features:
 *   - Sticky table header
 *   - Horizontal scroll for many subjects
 *   - Live total + percentage
 *   - Per-cell validation (clamped to that subject's max-marks)
 *   - Draft state — a cell left empty is treated as "not yet graded"
 *   - Type "A" to mark absent (-1 sentinel preserved for legacy)
 *   - Enter key jumps to the next student in the same column
 *   - Unsaved-changes warning on tab close
 *   - Save only sends the rows that actually changed
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  DataState,
  Input,
  Skeleton,
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { showToast } from "@/utils/toast";
import { serviceRequest } from "@/services/service-client";

interface Student {
  _id: string;
  first_name: string;
  last_name: string;
  admission_no: string;
  roll_no?: string;
}

interface ExamSubjectRecord {
  subject_id: string;
  subject_name: string;
  max_marks: number;
}

interface ExamRow {
  _id: string;
  title: string;
  class_name: string;
  class_id: string;
  starts_at: string;
  subjects: ExamSubjectRecord[];
  // Legacy fallback for old single-subject rows.
  subject?: string;
  max_marks?: number;
}

interface ResultSubjectRecord {
  subject_id: string;
  subject_name?: string;
  obtained_marks: number;
  max_marks?: number;
}

interface ResultRow {
  _id: string;
  exam_id: string;
  student_id: string;
  obtained_marks: number; // aggregate
  subjects?: ResultSubjectRecord[]; // breakdown
}

const ABSENT_SENTINEL = -1;

type MarkCell = number | "" | "A";
type MarksMap = Record<string, Record<string, MarkCell>>;

export function ExamMarksGroupEntryPage({
  examId,
  role = "ADMIN",
}: {
  examId: string;
  role?: "ADMIN" | "TEACHER";
}) {
  const { state: examState, run: runExam } = useSafeAsync<ExamRow>();
  const { state: studentState, run: runStudents } = useSafeAsync<Student[]>();
  const { state: resultsState, run: runResults } = useSafeAsync<ResultRow[]>();

  const [marks, setMarks] = useState<MarksMap>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const initialMarksRef = useRef<MarksMap>({});

  /* Step 1: load the exam */
  useEffect(() => {
    if (!examId) return;
    void runExam(async () => {
      const r = await serviceRequest<ExamRow>(`/api/exams/${examId}`);
      if (!r.ok) throw new Error(r.error.message || "Failed to load exam");
      return r.data!;
    });
  }, [examId, runExam]);

  /* Step 2: load students */
  useEffect(() => {
    const exam = examState.data;
    if (!exam?.class_id) return;
    void runStudents(async () => {
      const r = await serviceRequest<Student[]>(
        `/api/students?class_id=${encodeURIComponent(exam.class_id)}&status=active`
      );
      if (!r.ok) throw new Error(r.error.message || "Failed to load students");
      return r.data!;
    });
  }, [examState.data?.class_id, runStudents]);

  /* Step 3: load existing results */
  useEffect(() => {
    if (!examId) return;
    void runResults(async () => {
      const r = await serviceRequest<ResultRow[]>(`/api/exams/${examId}/results`);
      if (!r.ok) throw new Error(r.error.message || "Failed to load results");
      return r.data!;
    });
  }, [examId, runResults]);

  /* Step 4: hydrate the marks map once everything is loaded */
  const subjects: ExamSubjectRecord[] = useMemo(() => {
    const exam = examState.data;
    if (!exam) return [];
    if (exam.subjects && exam.subjects.length > 0) return exam.subjects;
    // Legacy fallback: a single-subject exam saved before the schema
    // change. Synthesize one column from the legacy fields.
    if (exam.subject) {
      return [
        {
          subject_id: exam.subject,
          subject_name: exam.subject,
          max_marks: exam.max_marks || 0,
        },
      ];
    }
    return [];
  }, [examState.data]);

  useEffect(() => {
    const students = studentState.data;
    if (!students || subjects.length === 0) return;

    const next: MarksMap = {};
    for (const student of students) {
      next[student._id] = {};
      for (const subject of subjects) {
        next[student._id][subject.subject_id] = "";
      }
    }

    // Apply existing results.
    for (const r of resultsState.data ?? []) {
      const row = next[r.student_id];
      if (!row) continue;
      const breakdown = r.subjects || [];
      if (breakdown.length > 0) {
        for (const rs of breakdown) {
          const cell: MarkCell =
            rs.obtained_marks === ABSENT_SENTINEL ? "A" : rs.obtained_marks;
          if (rs.subject_id in row) {
            row[rs.subject_id] = cell;
          }
        }
      } else if (subjects.length === 1) {
        // Legacy single-subject result without breakdown.
        const cell: MarkCell =
          r.obtained_marks === ABSENT_SENTINEL ? "A" : r.obtained_marks;
        row[subjects[0].subject_id] = cell;
      }
    }
    setMarks(next);
    initialMarksRef.current = JSON.parse(JSON.stringify(next));
    setDirty(false);
  }, [studentState.data, subjects, resultsState.data]);

  /* Unsaved-changes warning */
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const updateCell = useCallback(
    (studentId: string, subjectId: string, raw: string, max: number) => {
      let value: MarkCell;
      if (raw === "" || raw === null || raw === undefined) {
        value = "";
      } else if (raw.toUpperCase() === "A") {
        value = "A";
      } else {
        const n = Number(raw);
        if (Number.isNaN(n)) return;
        value = Math.min(Math.max(0, n), max);
      }
      setMarks((prev) => {
        const next = { ...prev, [studentId]: { ...(prev[studentId] || {}) } };
        next[studentId][subjectId] = value;
        return next;
      });
      setDirty(true);
    },
    []
  );

  const tableRef = useRef<HTMLTableElement>(null);
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const inputs = Array.from(
      tableRef.current?.querySelectorAll<HTMLInputElement>(
        `input[data-col="${e.currentTarget.dataset.col}"]`
      ) ?? []
    );
    const idx = inputs.indexOf(e.currentTarget);
    const nextEl = inputs[idx + 1] ?? inputs[0];
    nextEl?.focus();
    nextEl?.select();
  }

  /* Live totals */
  const totalsMap = useMemo(() => {
    const totals: Record<string, { obtained: number; max: number; absentCount: number }> =
      {};
    for (const studentId of Object.keys(marks)) {
      let obtained = 0;
      let max = 0;
      let absentCount = 0;
      for (const subject of subjects) {
        const cell = marks[studentId]?.[subject.subject_id];
        max += subject.max_marks;
        if (cell === "A") {
          absentCount += 1;
          continue;
        }
        if (cell === "" || cell == null) continue;
        obtained += Number(cell);
      }
      totals[studentId] = { obtained, max, absentCount };
    }
    return totals;
  }, [marks, subjects]);

  const filteredStudents = useMemo(() => {
    const students = studentState.data ?? [];
    if (!search.trim()) return students;
    const q = search.trim().toLowerCase();
    return students.filter(
      (s) =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.admission_no.toLowerCase().includes(q) ||
        (s.roll_no || "").toLowerCase().includes(q)
    );
  }, [studentState.data, search]);

  /* Save: ONE POST to /api/exams/:id/results with all changed students */
  async function handleSave() {
    if (subjects.length === 0 || !studentState.data?.length) return;
    setSaving(true);
    try {
      const payload: Array<{
        student_id: string;
        subjects: Array<{ subject_id: string; subject_name?: string; obtained_marks: number }>;
      }> = [];

      for (const student of studentState.data) {
        const row = marks[student._id];
        if (!row) continue;

        // Compare against the snapshot — skip students who didn't change.
        const before = initialMarksRef.current[student._id] || {};
        const changed = subjects.some((sub) => {
          const prev = before[sub.subject_id];
          const next = row[sub.subject_id];
          return prev !== next;
        });
        if (!changed) continue;

        // Only send subjects that have a graded value (not "" / undefined).
        const breakdown: Array<{
          subject_id: string;
          subject_name?: string;
          obtained_marks: number;
        }> = [];
        for (const sub of subjects) {
          const cell = row[sub.subject_id];
          if (cell === "" || cell == null) continue;
          breakdown.push({
            subject_id: sub.subject_id,
            subject_name: sub.subject_name,
            obtained_marks: cell === "A" ? ABSENT_SENTINEL : Number(cell),
          });
        }
        if (breakdown.length === 0) continue;
        payload.push({ student_id: student._id, subjects: breakdown });
      }

      if (payload.length === 0) {
        showToast("Nothing changed.", "info");
        return;
      }

      const r = await serviceRequest(`/api/exams/${examId}/results`, {
        method: "POST",
        body: JSON.stringify({ results: payload }),
      });
      if (!r.ok) {
        showToast(r.error.message || "Failed to save marks.", "error");
        return;
      }
      showToast(`Marks saved for ${payload.length} student${payload.length > 1 ? "s" : ""}.`, "success");
      initialMarksRef.current = JSON.parse(JSON.stringify(marks));
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  /* Loading & error */
  if (
    examState.status === "loading" ||
    examState.status === "idle" ||
    studentState.status === "loading"
  ) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }
  if (examState.status === "error") {
    return (
      <DataState variant="error" title="Couldn't load this exam" message={examState.error} />
    );
  }
  if (studentState.status === "error") {
    return (
      <DataState variant="error" title="Couldn't load students" message={studentState.error} />
    );
  }

  const exam = examState.data!;
  const students = filteredStudents;
  const completedRows = students.filter((s) =>
    subjects.every((sub) => {
      const cell = marks[s._id]?.[sub.subject_id];
      return cell !== "" && cell != null;
    })
  ).length;
  const totalMaxMarks = subjects.reduce((acc, s) => acc + s.max_marks, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Compact context header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-start gap-4 flex-wrap">
          <Link
            to={role === "ADMIN" ? "/admin/exams" : "/teacher/exams"}
            className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
            aria-label="Back to exams"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-black text-slate-900 truncate">{exam.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="text-[9px] font-bold px-2 py-0.5">
                {exam.class_name}
              </Badge>
              <Badge variant="gray" className="text-[9px] font-bold px-2 py-0.5">
                {exam.starts_at}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400">
                · {subjects.length} {subjects.length === 1 ? "subject" : "subjects"} ·{" "}
                {students.length} students · max {totalMaxMarks}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
                search
              </span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="pl-8 h-9 w-56 text-sm rounded-lg"
              />
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                Completed
              </p>
              <p className="text-[14px] font-black text-slate-900 leading-none mt-1">
                {completedRows}
                <span className="text-[10px] font-bold text-slate-400 ml-1">
                  / {students.length}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marks table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
          <table ref={tableRef} className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-14">
                  Roll
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[180px]">
                  Student
                </th>
                {subjects.map((subject) => (
                  <th
                    key={subject.subject_id}
                    className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-24"
                  >
                    <div className="truncate">{subject.subject_name}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                      / {subject.max_marks}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-24 text-right">
                  Total
                </th>
                <th className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-20 text-right">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td
                    colSpan={3 + subjects.length}
                    className="px-4 py-12 text-center text-[12px] font-bold text-slate-400"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const totals = totalsMap[student._id] || {
                    obtained: 0,
                    max: 0,
                    absentCount: 0,
                  };
                  const pct = totals.max > 0 ? (totals.obtained / totals.max) * 100 : 0;
                  return (
                    <tr key={student._id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-[12px] font-bold text-slate-400">
                        #{student.roll_no || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[12px] font-bold text-slate-900 leading-tight">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 leading-tight mt-0.5">
                          {student.admission_no}
                        </div>
                      </td>
                      {subjects.map((subject) => {
                        const cell = marks[student._id]?.[subject.subject_id] ?? "";
                        const isAbsent = cell === "A";
                        return (
                          <td key={subject.subject_id} className="px-2 py-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              data-col={subject.subject_id}
                              value={cell === "" ? "" : String(cell)}
                              onChange={(e) =>
                                updateCell(
                                  student._id,
                                  subject.subject_id,
                                  e.target.value,
                                  subject.max_marks
                                )
                              }
                              onKeyDown={handleKeyDown}
                              onFocus={(e) => e.target.select()}
                              placeholder="—"
                              className={`h-8 w-full rounded-md border text-center text-[12px] font-bold outline-none transition-all ${
                                isAbsent
                                  ? "bg-rose-50 border-rose-200 text-rose-700"
                                  : "bg-white border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5"
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right text-[12px] font-black text-slate-900">
                        {totals.obtained}
                        <span className="text-[10px] font-bold text-slate-400">
                          {" "}
                          / {totals.max}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] font-black">
                        <span
                          className={
                            pct >= 50
                              ? "text-emerald-600"
                              : totals.max === 0
                                ? "text-slate-400"
                                : "text-rose-600"
                          }
                        >
                          {totals.max > 0 ? pct.toFixed(1) : "—"}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 flex items-center gap-3">
          <span>
            Tip: type <kbd className="px-1 rounded bg-slate-100 text-slate-700">A</kbd> for absent
          </span>
          <span>·</span>
          <span>Press Enter to jump to the next student in the same column</span>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-6xl bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between z-40">
        <div className="flex items-center gap-3 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-blue-300">edit_note</span>
          <p className="text-[11px] font-bold truncate">
            {dirty ? (
              <span className="text-amber-300">Unsaved changes</span>
            ) : (
              <span className="text-slate-300">All changes saved</span>
            )}
            <span className="text-slate-400">
              {" "}
              · {subjects.length} subjects · {students.length} students
            </span>
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-widest gap-2 active:scale-95 transition-all"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">save</span>
              Save marks
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
