import { AppIcon } from "shared/ui/AppIcon";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { 
  Badge, 
  Card, 
  DataState, 
  Skeleton, 
  Button,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
  GuidanceChecklist
} from "@/components/ui";
import { useResult } from "../hooks/useResults";
import { exportMarksheet } from "@/utils/marksheet";
import { showToast } from "@/utils/toast";
import { useAuth } from "@/hooks/useAuth";
import { serviceRequest } from "@/services/service-client";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";

export function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const isTeacher = pathname.includes("/teacher");
  const isParent = pathname.includes("/parent");
  const backPath = isParent 
    ? "/parent/results" 
    : isTeacher 
      ? "/teacher/results" 
      : "/admin/results";
  
  const { state } = useResult(id);
  const { schoolName, logoUrl } = useSchoolBranding();
  const brandedSchoolName = schoolName || "School";

  const [examData, setExamData] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);

  const row = state.data;
  const percentage = row ? (row.obtained_marks / row.max_marks) * 100 : 0;
  const isPass = percentage >= 40;
  const allSubjects = useMemo(() => {
    if (!row) return [];
    if (examData && Array.isArray(examData.subjects)) {
      return examData.subjects.map((examSub: any) => {
        const gradedSub = (row.subjects || []).find((s) => s.subject_id === examSub.subject_id);
        return {
          subject_id: examSub.subject_id,
          subject_name: examSub.subject_name,
          max_marks: examSub.max_marks,
          obtained_marks: gradedSub ? gradedSub.obtained_marks : undefined,
        };
      });
    }
    return (row.subjects || []).map((s) => ({
      subject_id: s.subject_id,
      subject_name: s.subject_name,
      max_marks: s.max_marks,
      obtained_marks: s.obtained_marks,
    }));
  }, [examData, row]);

  useEffect(() => {
    if (state.status === "success" && state.data?.exam_id) {
      setExamLoading(true);
      serviceRequest<any>(`/api/exams/${state.data.exam_id}`)
        .then((res) => {
          if (res.ok) {
            setExamData(res.data);
          }
        })
        .finally(() => {
          setExamLoading(false);
        });
    }
  }, [state.status, state.data?.exam_id]);

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <Skeleton className="h-12 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Skeleton className="lg:col-span-2 h-[600px] rounded-[24px]" />
           <Skeleton className="h-[400px] rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return <DataState variant="error" title="Result not found" message={state.error} />;
  }

  if (!row) return <DataState variant="empty" title="No data" />;

  return (
    <EntityCreateLayout
      backTo={backPath}
      backLabel="Return to Results"
      eyebrow="Academic Record"
      icon="grading"
      title="Assessment Details"
      subtitle={`${row.student_name} — ${row.exam_title}`}
      asideTitle="Performance Analytics"
      aside={
        <>
          <GuidanceSection title="Result Summary">
            This student has achieved a score of **{percentage.toFixed(1)}%** in the **{row.exam_title}**. 
            {isPass 
              ? " This is a passing performance." 
              : " This result is below the passing threshold."}
          </GuidanceSection>

          <GuidanceSection title="Grade Distribution">
            <GuidanceCallout tone={row.grade === "F" ? "rose" : "emerald"}>
              Current Grade: **{row.grade}**
            </GuidanceCallout>
          </GuidanceSection>

          <div className="pt-4 space-y-3">
             <Button 
               variant="primary" 
               className="h-11 w-full rounded-xl flex items-center justify-center gap-2"
               onClick={() => {
                 exportMarksheet(row, { schoolName: brandedSchoolName, logoUrl });
                 showToast("Generating marksheet...", "info");
               }}
             >
               <AppIcon name="Download" size={18} />
               Download Marksheet
             </Button>
          </div>

          <GuidanceChecklist
            items={[
              { done: true, label: "Subject marks verified" },
              { done: true, label: "Aggregate computed" },
              { done: true, label: "Grade assigned" },
              { done: !!row.remarks, label: "Remarks provided" },
            ]}
          />
        </>
      }
    >
      <div className="space-y-8">
        {/* Header Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marks</p>
            <p className="text-xl font-black text-slate-900">{row.obtained_marks} / {row.max_marks}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
            <p className={`text-xl font-black ${percentage >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{percentage.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
            <p className="text-xl font-black text-slate-900">{row.grade}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <Badge variant={isPass ? "success" : "error"} className="mt-1">
              {isPass ? "Passed" : "Failed"}
            </Badge>
          </div>
        </div>

        {/* Subjects Breakdown */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 mb-4 px-1">Subject Breakdown</h3>
          <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Marks</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allSubjects.length > 0 ? allSubjects.map((s: any) => {
                  const isAbsent = s.obtained_marks === -1;
                  const hasMarks = s.obtained_marks !== undefined;
                  const pct = hasMarks && s.max_marks > 0 && !isAbsent
                    ? (s.obtained_marks / s.max_marks) * 100
                    : 0;

                  return (
                    <tr key={s.subject_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{s.subject_name}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasMarks ? (
                          <p className="text-sm font-black text-slate-700">
                            {isAbsent ? "Absent" : s.obtained_marks}{" "}
                            <span className="text-slate-300 font-medium">/ {s.max_marks}</span>
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-slate-400">
                            Not Graded <span className="text-slate-300 font-medium">/ {s.max_marks}</span>
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                           <span className="text-[11px] font-bold text-slate-500">
                             {hasMarks ? (isAbsent ? "0%" : `${pct.toFixed(0)}%`) : "—"}
                           </span>
                           <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  !hasMarks 
                                    ? 'bg-slate-200' 
                                    : isAbsent
                                      ? 'bg-rose-500'
                                      : pct >= 80 
                                        ? 'bg-emerald-500' 
                                        : pct >= 40 
                                          ? 'bg-blue-500' 
                                          : 'bg-rose-500'
                                }`}
                                style={{ width: `${hasMarks ? pct : 0}%` }}
                              />
                           </div>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                   <tr>
                     <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{row.exam_subject}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-sm font-black text-slate-700">{row.obtained_marks} <span className="text-slate-300 font-medium">/ {row.max_marks}</span></p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-bold text-slate-500">{percentage.toFixed(0)}%</span>
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        {row.remarks && (
          <div className="bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50">
            <div className="flex items-center gap-2 mb-3">
              <AppIcon name="MessageSquare" size={18} className="text-blue-600" />
              <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Teacher Remarks</h4>
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{row.remarks}"</p>
          </div>
        )}

        {/* Student Info */}
        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 grid md:grid-cols-2 gap-6">
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Student Identity</p>
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg">
                    {row.student_name[0]}
                 </div>
                 <div>
                    <p className="font-bold text-slate-900">{row.student_name}</p>
                    <p className="text-xs text-slate-500">{row.admission_no} • {row.class_name}</p>
                 </div>
              </div>
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Grading Timeline</p>
              <div className="flex items-center gap-2">
                 <AppIcon name="Calendar" size={18} className="text-slate-400" />
                 <p className="text-sm font-bold text-slate-700">Recorded on {new Date(row.graded_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              </div>
           </div>
        </div>
      </div>
    </EntityCreateLayout>
  );
}
