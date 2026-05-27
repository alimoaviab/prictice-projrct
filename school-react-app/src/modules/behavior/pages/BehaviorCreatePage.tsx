import { AppIcon } from "shared/ui/AppIcon";
import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import BehaviorForm from "../components/BehaviorForm";
import { useBehavior } from "../hooks/useBehavior";
import { BehaviorFormInput } from "../types/behavior.types";
import { showToast } from "@/utils/toast";

function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record._id === "string") return record._id;
    if (typeof record.id === "string") return record.id;
    if (typeof record.$oid === "string") return record.$oid;
    if (record._id && typeof record._id === "object") {
      const nested = record._id as Record<string, unknown>;
      if (typeof nested.$oid === "string") return nested.$oid;
    }
  }
  return "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

export function BehaviorCreatePage() {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { addBehavior } = useBehavior();

  const { state: studentState, run: runStudents } = useSafeAsync<Array<{ _id: string; name: string; class_id?: string }>>();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runStudents(async () => {
        const result = await serviceRequest<any>("/api/students");
        if (!result.ok) throw new Error(result.error.message || "Failed to load students");

        const rawData = result.data;
        const students = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);

        return students.map((student: any) => {
          const fullName = [
            firstText(student.first_name, student.firstName),
            firstText(student.last_name, student.lastName)
          ].filter(Boolean).join(" ").trim();
          const displayName = firstText(
            student.name,
            student.full_name,
            student.student_name,
            fullName,
            student.admission_no,
            student.roll_no
          );
          const classId = toId(student.class_id);

          return {
            _id: toId(student._id) || toId(student.id),
            name: displayName,
            class_id: classId
          };
        }).filter((student: any) => Boolean(student._id) && Boolean(student.name));
      }),
      runClasses(async () => {
        const result = await serviceRequest<any>("/api/classes");
        if (!result.ok) throw new Error(result.error.message || "Failed to load classes");

        const rawData = result.data;
        const classes = Array.isArray(rawData) ? rawData : (rawData?.data ?? []);

        return classes.map((item: any) => ({
          _id: toId(item._id) || toId(item.id),
          name: item.name?.trim() || "Unnamed Class"
        })).filter((item: any) => Boolean(item._id));
      })
    ]);
  }, [runStudents, runClasses]);

  useEffect(() => {
    void loadDependencies().catch(() => { });
  }, [loadDependencies]);

  const isLoading = studentState.status === "loading" || classState.status === "loading" || studentState.status === "idle";

  async function handleCreate(input: BehaviorFormInput) {
    const result = await addBehavior(input);
    if (result.ok) {
      // Toast is already raised by useBehavior on success.
      const basePath = pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior";
      navigate(basePath);
    } else {
      showToast(result.error.message || "Failed to add record", "error");
    }
    return result;
  }

  if (studentState.status === "error" || classState.status === "error") {
    return <DataState variant="error" title="Failed to load dependencies" message={studentState.error || classState.error} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior"}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case hover:text-slate-900 transition-all group"
        >
          <AppIcon name="ArrowLeft" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Behavior Records
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Student Conduct Desk
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-24">
        <div className="w-full lg:w-[68%]">
          <div className="bg-white border border-slate-200 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden ring-1 ring-slate-900/5 transition-all">
            <div className="relative px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                  <AppIcon name="Gavel" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">New Behavior Record</h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Log disciplinary incidents and student conduct updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <BehaviorForm
                  onSubmit={handleCreate}
                  onCancel={() => navigate(pathname.includes("/teacher") ? "/teacher/behavior" : "/admin/behavior")}
                  students={studentState.data ?? []}
                  classes={classState.data ?? []}
                />
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[32%] lg:sticky lg:top-8">
          <div className="bg-slate-50/80 border border-slate-200 rounded-[20px] p-5 ring-1 ring-slate-900/5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
                <AppIcon name="Info" size={16} />
              </div>
              <h3 className="text-[11px] font-bold text-slate-900 normal-case tracking-tight">Behavior Guide</h3>
            </div>

            <div className="space-y-5">
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Purpose
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                  Behavior records help track incidents, interventions, and student progress consistently.
                </p>
              </section>

              <section>
                <h4 className="text-[10px] font-bold text-slate-400 normal-case mb-1.5 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  Severity Rule
                </h4>
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5">
                  <p className="text-[10px] leading-snug text-indigo-800 font-bold">
                    Use consistent severity levels so escalation and parent communication remain accurate.
                  </p>
                </div>
              </section>

              <div className="pt-2 border-t border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-400 normal-case mb-2.5">Quick Checklist</h4>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Select class and student
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Add clear description
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-medium text-slate-600">
                    <AppIcon name="CheckCircle2" size={14} className="text-emerald-500" />
                    Set status and follow-up notes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
