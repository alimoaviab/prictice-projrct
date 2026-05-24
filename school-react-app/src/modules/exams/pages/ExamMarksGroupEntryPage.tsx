import { AppIcon } from "shared/ui/AppIcon";
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
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      setTimeout(() => {
        navigate(role === "ADMIN" ? "/admin/exams" : "/teacher/exams");
      }, 800);
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
    <div className="space-y-6">
      {/* Compact context header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3">
        <div className="flex items-start gap-4 flex-wrap">
          <Link
            to={role === "ADMIN" ? "/admin/exams" : "/teacher/exams"}
            className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
            aria-label="Back to exams"
          >
            <AppIcon name="ChevronLeft" size={18} />
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
              <AppIcon name="Search" size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
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

      {/* Marks Vertical Entry */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-12 text-center text-[12px] font-bold text-slate-400">
            No students found.
          </div>
        ) : (
          students.map((student) => {
            const totals = totalsMap[student._id] || {
              obtained: 0,
              max: 0,
              absentCount: 0,
            };
            const pct = totals.max > 0 ? (totals.obtained / totals.max) * 100 : 0;
            return (
              <div key={student._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col hover:border-blue-200 transition-all">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                   <div>
                      <p className="text-[12px] font-black text-slate-900">{student.first_name} {student.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ROLL: {student.roll_no || "—"} · {student.admission_no}</p>
                   </div>
                   <div className="text-right">
                      <p className={`text-[12px] font-black ${pct >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                         {totals.obtained} / {totals.max}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">{pct.toFixed(1)}%</p>
                   </div>
                </div>

                <div className="space-y-3">
                   {subjects.map((subject, idx) => {
                      const cell = marks[student._id]?.[subject.subject_id] ?? "";
                      const isAbsent = cell === "A";
                      const isLast = idx === subjects.length - 1;

                      return (
                        <div key={subject.subject_id} className="flex items-center gap-3">
                           <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 truncate">{subject.subject_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 tracking-tighter uppercase">Max {subject.max_marks}</p>
                           </div>
                           <input
                              type="text"
                              inputMode="numeric"
                              data-student={student._id}
                              data-idx={idx}
                              value={cell === "" ? "" : String(cell)}
                              onChange={(e) =>
                                updateCell(
                                  student._id,
                                  subject.subject_id,
                                  e.target.value,
                                  subject.max_marks
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (isLast) {
                                    handleSave();
                                  } else {
                                    const nextInput = document.querySelector<HTMLInputElement>(`input[data-student="${student._id}"][data-idx="${idx + 1}"]`);
                                    nextInput?.focus();
                                    nextInput?.select();
                                  }
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              placeholder="0"
                              className={`h-9 w-20 rounded-xl border text-center text-[13px] font-black outline-none transition-all ${
                                isAbsent
                                  ? "bg-rose-50 border-rose-200 text-rose-700 shadow-inner"
                                  : "bg-slate-50/50 border-slate-100 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5"
                              }`}
                            />
                        </div>
                      );
                   })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Area - Now directly below the entries */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${dirty ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <AppIcon name={dirty ? "pending_actions" : "check_circle"} />
          </div>
          <div>
            <p className="text-[13px] font-black text-slate-900">
              {dirty ? "Unsaved Progress" : "Changes Synchronized"}
            </p>
            <p className="text-[11px] font-bold text-slate-400 normal-case ">
              {subjects.length} subjects · {students.length} students detected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <p className="text-[10px] font-bold text-slate-400 hidden md:block text-right">
              Tip: Press <kbd className="px-1 rounded bg-slate-100 border border-slate-200 text-slate-600">Enter</kbd> to move down<br/>
              Last subject Enter will auto-save
           </p>
           <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[12px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
           >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <AppIcon name="Save" />
                Save All Marks
              </>
            )}
           </Button>
        </div>
      </div>
    </div>
  );
}
