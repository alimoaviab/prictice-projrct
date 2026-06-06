import { AppIcon } from "shared/ui/AppIcon";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Card, DataState, Skeleton, TableSkeleton, Badge, DataTable, DataTableColumn, RowAction, StatCardGrid } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { ResultForm } from "../components/ResultForm";
import { useResults } from "../hooks/useResults";
import { ResultRow } from "../types/result.types";
import { useClasses } from "../../classes/hooks/useClasses";
import { useExams } from "../../exams/hooks/useExams";
import { useQueryParams } from "@/hooks/useQueryParams";
import { exportMarksheet, exportExamMarksheet } from "@/utils/marksheet";
import { showToast } from "@/utils/toast";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { useCertificateTemplates } from "@/modules/certificates/hooks/useCertificates";
import { BulkGeneratorModal } from "@/modules/certificates/components/BulkGeneratorModal";
import type { CertificateTemplate } from "@/modules/certificates/types/certificate.types";

export function ResultPage() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { state: templatesState } = useCertificateTemplates();
    const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);

    const resultTemplates = (templatesState.data || []).filter(
        (t) => (t.type as string) === "result_card"
    );
    const isTeacher = pathname.includes("/teacher");
    const { currentParams, updateQuery } = useQueryParams();
    const exam_id = currentParams.get("exam_id") || "all";
    const class_id = currentParams.get("class_id") || "all";
    const student_id = currentParams.get("student_id") || "all";
    const subject_id = currentParams.get("subject_id") || "all";
    const date_filter = currentParams.get("date") || "";
    
    const { schoolName, logoUrl } = useSchoolBranding();
    const brandedSchoolName = schoolName || "School";

    const { state: classState } = useClasses();
    const { state: examListState } = useExams(class_id !== "all" ? { class_id } : {});

    const { state, addResult } = useResults({ 
        exam_id: exam_id !== "all" ? exam_id : undefined,
        class_id: class_id !== "all" ? class_id : undefined,
        student_id: student_id !== "all" ? student_id : undefined,
        subject_id: subject_id !== "all" ? subject_id : undefined,
    });
    const [searchQuery, setSearchQuery] = useState(currentParams.get("search") || "");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [isAdding, setIsAdding] = useState(false);
    
    const [classFilter, setClassFilter] = useState(class_id);
    const [examFilter, setExamFilter] = useState(exam_id);
    const [studentFilter, setStudentFilter] = useState(student_id);
    const [subjectFilter, setSubjectFilter] = useState(subject_id);
    const [dateFilter, setDateFilter] = useState(date_filter);

    useEffect(() => {
        setSearchQuery(currentParams.get("search") || "");
        setClassFilter(currentParams.get("class_id") || "all");
        setExamFilter(currentParams.get("exam_id") || "all");
        setStudentFilter(currentParams.get("student_id") || "all");
        setSubjectFilter(currentParams.get("subject_id") || "all");
        setDateFilter(currentParams.get("date") || "");
    }, [currentParams.toString()]);

    const { state: examState, run: runExams } = useSafeAsync<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>();
    const { state: studentState, run: runStudents } = useSafeAsync<
        Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
    >();

    const loadExams = useCallback(() => {
        return runExams(async () => {
            const result = await serviceRequest<Array<{ _id: string; title: string; subject: string; class_name?: string; class_id?: string }>>("/api/exams");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load exams");
            }

            return result.data;
        });
    }, [runExams]);

    const loadStudents = useCallback(() => {
        return runStudents(async () => {
            const result = await serviceRequest<
                Array<{ _id: string; first_name: string; last_name: string; admission_no: string; class_id: string }>
            >("/api/students");
            if (!result.ok) {
                throw new Error(result.error.message || "Failed to load students");
            }

            return result.data;
        });
    }, [runStudents]);

    useEffect(() => {
        void loadExams().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
        void loadStudents().catch(() => {
            // Error state is already managed by useSafeAsync.
        });
    }, [loadExams, loadStudents]);

    const filteredRows = useMemo(() => {
        const rows = state.data || [];
        const q = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const queryMatch = 
                q.length === 0 ||
                row.student_name.toLowerCase().includes(q) ||
                row.exam_title.toLowerCase().includes(q) ||
                row.exam_subject.toLowerCase().includes(q) ||
                (row.admission_no || "").toLowerCase().includes(q) ||
                (row.class_name || "").toLowerCase().includes(q);
            
            const classMatch = classFilter === "all" ? true : row.class_id === classFilter;
            const studentMatch = studentFilter === "all" ? true : row.student_id === studentFilter;
            const subjectMatch = subjectFilter === "all" ? true : (row.subjects || []).some((s: any) => s.subject_id === subjectFilter);
            const dateMatch = dateFilter === "" ? true : row.graded_at?.split('T')[0] === dateFilter;

            return queryMatch && classMatch && studentMatch && subjectMatch && dateMatch;
        });
    }, [state.data, searchQuery, classFilter, studentFilter, subjectFilter, dateFilter]);

    const columns: DataTableColumn<ResultRow>[] = [
        {
            key: "student",
            label: "Student performance",
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold normal-case">
                        {(row.student_name || 'S').substring(0, 1)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 leading-none mb-1">{row.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold normal-case tracking-tighter">{row.admission_no}</p>
                    </div>
                </div>
            ),
        },
        {
            key: "exam",
            label: "Assessment",
            render: (row) => {
                const count = row.subjects && row.subjects.length > 0
                    ? row.subjects.length
                    : (row.exam_subject ? row.exam_subject.split(",").filter(s => s.trim()).length : 0);
                return (
                    <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <p className="text-[11px] font-bold text-slate-700 leading-none tracking-tight">{row.exam_title}</p>
                            {row.exam_term && (
                                <Badge variant="secondary" className="text-[8px] font-extrabold px-1 py-0">
                                    {row.exam_term}
                                </Badge>
                            )}
                        </div>
                        <p className="text-[9px] font-bold text-blue-600 normal-case ">
                            {count} {count === 1 ? "subject" : "subjects"}
                        </p>
                    </div>
                );
            },
        },
        {
            key: "score",
            label: "Performance score",
            render: (row) => {
                const percentage = (row.obtained_marks / row.max_marks) * 100;
                return (
                    <div className="flex flex-col w-32">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-slate-700">{row.obtained_marks} / {row.max_marks}</span>
                            <span className={`text-[10px] font-bold ${percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-blue-600' : 'text-red-500'}`}>{percentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            key: "grade",
            label: "Grade",
            render: (row) => (
                <Badge variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"} className="text-[10px] font-bold normal-case px-2 py-0.5">
                    {row.grade}
                </Badge>
            ),
        }
    ];

    const rowActions: RowAction<ResultRow>[] = [
        {
          icon: "visibility",
          label: "View",
          variant: "ghost",
          onClick: (row) => {
            const base = isTeacher ? "/teacher" : "/admin";
            navigate(`${base}/results/${row._id}`);
          },
        },
        {
          icon: "download",
          label: "Marksheet",
          variant: "primary",
          onClick: (row) => {
            exportMarksheet(row, { schoolName: brandedSchoolName, logoUrl });
            showToast("Generating marksheet…", "info");
          },
        },
    ];

    const isDependencyLoading =
        examState.status === "idle" || examState.status === "loading" || studentState.status === "idle" || studentState.status === "loading";

    const examOptions = (examState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.title} - ${item.subject}`.trim()
    }));

    const studentOptions = (studentState.data ?? []).map((item) => ({
        id: item._id,
        class_id: item.class_id,
        label: `${item.admission_no} - ${item.first_name} ${item.last_name}`.trim()
    }));
    const subjectOptions = useMemo(() => {
        const seen = new Map<string, string>();
        (state.data || []).forEach((row) => {
            (row.subjects || []).forEach((subject: any) => {
                if (subject.subject_id && !seen.has(subject.subject_id)) {
                    seen.set(subject.subject_id, subject.subject_name || subject.subject_id);
                }
            });
        });
        return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
    }, [state.data]);

    return (
        <div className="space-y-6 relative min-h-[80vh] pb-10">
            {/* Stats Section */}
            <StatCardGrid
              items={(() => {
                const rows = state.data || [];
                const totalResults = rows.length;
                const avgPerformance = totalResults > 0 
                    ? Math.round(rows.reduce((sum, r) => sum + (r.obtained_marks / r.max_marks) * 100, 0) / totalResults)
                    : 0;
                const passCount = rows.filter(r => (r.obtained_marks / r.max_marks) >= 0.4).length;
                const distinctionCount = rows.filter(r => (r.obtained_marks / r.max_marks) >= 0.8).length;
                return [
                    { label: "Total Results", value: totalResults, icon: "leaderboard", accent: "blue" as const },
                    { label: "Avg. Score", value: `${avgPerformance}%`, icon: "trending_up", accent: "emerald" as const },
                    { label: "Distinctions", value: distinctionCount, icon: "stars", accent: "amber" as const },
                    { label: "Pass Rate", value: totalResults > 0 ? `${Math.round((passCount / totalResults) * 100)}%` : "0%", icon: "verified", accent: "purple" as const },
                ];
              })()}
            />

            {/* Toolbar Section - Unified & Sticky */}
            <div className="premium-card p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm rounded-xl no-print">
                <div className="flex flex-1 items-center gap-2 max-w-2xl">
                    <div className="relative flex-1">
                        <AppIcon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                updateQuery({ search: val });
                            }}
                            placeholder="Search student, exam or admission no..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-600/5 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <select
                        value={classFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setClassFilter(val);
                            setExamFilter("all");
                            setStudentFilter("all");
                            setSubjectFilter("all");
                            updateQuery({ class_id: val, exam_id: "all", student_id: "all", subject_id: "all" });
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
                    >
                        <option value="all">All Classes</option>
                        {((classState.data as any)?.data || []).map((c: any) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={examFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setExamFilter(val);
                            updateQuery({ exam_id: val });
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
                        disabled={classFilter === "all"}
                    >
                        <option value="all">Select Exam</option>
                        {(examListState.data || []).map((e: any) => (
                            <option key={e._id} value={e._id}>{e.title}</option>
                        ))}
                    </select>

                    <select
                        value={studentFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setStudentFilter(val);
                            updateQuery({ student_id: val });
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
                    >
                        <option value="all">All Students</option>
                        {studentOptions
                            .filter((s) => classFilter === "all" || s.class_id === classFilter)
                            .map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                    </select>

                    <select
                        value={subjectFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSubjectFilter(val);
                            updateQuery({ subject_id: val });
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
                    >
                        <option value="all">All Subjects</option>
                        {subjectOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                    </select>

                    <input 
                        type="date"
                        value={dateFilter}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDateFilter(val);
                            updateQuery({ date: val });
                        }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-600 outline-none cursor-pointer transition-all hover:border-slate-300 focus:border-blue-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            exportExamMarksheet(filteredRows, { schoolName: brandedSchoolName, logoUrl });
                            showToast("Generating printable report…", "info");
                        }}
                        className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center gap-2 no-print"
                    >
                        <AppIcon name="Printer" size={16} />
                        Print report
                    </button>
                    <div className="h-6 w-px bg-slate-200 no-print" />
                    <div className="flex items-center rounded-lg bg-slate-100 p-1 shadow-inner no-print">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                                viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <AppIcon name="LayoutGrid" size={16} />
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex h-7 items-center gap-2 rounded-md px-3 text-[11px] font-bold transition-all ${
                                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            <AppIcon name="ViewList" size={16} />
                            List
                        </button>
                    </div>
                    <div className="h-6 w-px bg-slate-200 no-print" />
                    <span className="text-[10px] font-bold text-slate-900 normal-case  px-2 whitespace-nowrap no-print">
                        {filteredRows.length} <span className="text-slate-400">Records</span>
                    </span>
                    <div className="h-6 w-px bg-slate-200 no-print" />
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`inline-flex h-9 items-center gap-2 px-5 text-[11px] font-bold normal-case  transition-all rounded-xl shadow-lg active:scale-95 no-print ${
                            isAdding ? "bg-slate-900 text-white" : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
                        }`}
                    >
                        <AppIcon name={isAdding ? "close" : "add_box"} size={18} />
                        {isAdding ? "Cancel" : "Add result"}
                    </button>
                </div>
            </div>

            {/* Record Form - Collapsible Premium Style */}
            {isAdding && (
                <div className="premium-card p-6 bg-white border-blue-100 shadow-xl shadow-blue-900/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-slate-900">Add assessment results</h2>
                        <p className="text-[11px] font-bold text-slate-400 normal-case  mt-1">Single student entry</p>
                    </div>
                    {isDependencyLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full rounded-xl" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full rounded-xl" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    ) : (
                        <ResultForm 
                            examOptions={examOptions} 
                            studentOptions={studentOptions} 
                            onCreate={async (data) => {
                                await addResult(data);
                                setIsAdding(false);
                            }} 
                        />
                    )}
                </div>
            )}

            {/* Canva Designed Result Card Layouts */}
            {templatesState.status !== "loading" && templatesState.status !== "idle" && resultTemplates.length > 0 && (
                <div className="space-y-4 no-print mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <AppIcon name="Palette" size={14} />
                        </div>
                        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                            Canva Designed Result Card Layouts
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {resultTemplates.map((template) => (
                            <div 
                                key={template._id} 
                                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl pointer-events-none" />
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-black uppercase tracking-widest">
                                            Canva Template
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 capitalize">
                                            {template.orientation}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-xs mb-1 group-hover:text-indigo-600 transition-colors">
                                        {template.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Designed on {new Date(template.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/admin/templates/edit/${template._id}`)}
                                        className="flex-1 h-8 rounded-lg border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Edit Layout
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTemplate(template)}
                                        className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[9px] font-black uppercase tracking-widest text-white shadow-sm transition-colors"
                                    >
                                        Print Marks Cards
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div>
                {state.status === "loading" || state.status === "idle" ? (
                    <div className="space-y-8">
                        <TableSkeleton />
                    </div>
                ) : filteredRows.length === 0 ? (
                    <DataState variant="empty" title="No performance data found" message="Start recording student assessment results to see analytics." />
                ) : (
                    viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {filteredRows.map((row) => {
                                const percentage = (row.obtained_marks / row.max_marks) * 100;
                                return (
                                    <div key={row._id} className="premium-card group relative flex flex-col p-0 overflow-hidden transition-all duration-500 bg-white border-slate-200/60 hover:shadow-2xl hover:shadow-slate-200/80 hover:-translate-y-1">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-bold normal-case shadow-sm">
                                                    {(row.student_name || 'S').substring(0, 1)}
                                                </div>
                                                <Badge variant={row.grade === "A" || row.grade === "A+" ? "success" : row.grade === "F" ? "error" : "primary"} className="text-[10px] font-bold normal-case  px-2 py-0.5">
                                                    Grade {row.grade}
                                                </Badge>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{row.student_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 normal-case  mt-1">{row.admission_no} • {row.class_name}</p>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50 mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 normal-case ">Score analysis</span>
                                                    <span className={`text-[11px] font-bold ${percentage >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{percentage.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-700 rounded-full ${percentage >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-500 mt-2 text-center">
                                                    Obtained <span className="text-slate-900">{row.obtained_marks}</span> out of <span className="text-slate-900">{row.max_marks}</span>
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                                                <AppIcon name="FileText" size={14} className="text-blue-600" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                                        <p className="text-[10px] font-bold text-slate-900 truncate normal-case leading-none">{row.exam_title}</p>
                                                        {row.exam_term && (
                                                            <Badge variant="secondary" className="text-[8px] font-extrabold px-1 py-0 shrink-0">
                                                                {row.exam_term}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 normal-case ">
                                                        {(() => {
                                                            const count = row.subjects && row.subjects.length > 0
                                                                ? row.subjects.length
                                                                : (row.exam_subject ? row.exam_subject.split(",").filter(s => s.trim()).length : 0);
                                                            return `${count} ${count === 1 ? "subject" : "subjects"}`;
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto px-5 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-white transition-all">
                                            <button 
                                              onClick={() => exportMarksheet(row, { schoolName: brandedSchoolName, logoUrl })}
                                              className="text-[10px] font-bold text-slate-400 normal-case  hover:text-blue-600 flex items-center gap-1 transition-colors"
                                            >
                                                <AppIcon name="BookOpen" size={14} />
                                                Report
                                            </button>
                                            <button 
                                              onClick={() => {
                                                const base = isTeacher ? "/teacher" : "/admin";
                                                navigate(`${base}/results/${row._id}`);
                                              }}
                                              className="group/btn h-8 px-4 rounded-lg bg-blue-600 text-[10px] font-bold text-white normal-case  hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                                            >
                                                Details
                                                <AppIcon name="QueryStats" size={14} className="transition-transform group-hover/btn:translate-x-1" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="premium-card overflow-hidden border-slate-200/60 shadow-sm bg-white rounded-2xl">
                            <DataTable
                                columns={columns}
                                rows={filteredRows}
                                rowKey={(row) => row._id}
                                sortable
                                paginated={10}
                                rowActions={rowActions}
                            />
                        </div>
                    )
                )}
            </div>

            {/* Real pagination is rendered by <DataTable paginated={N}> in the list view. */}
            
            {selectedTemplate && (
                <BulkGeneratorModal
                    isOpen={selectedTemplate !== null}
                    onClose={() => setSelectedTemplate(null)}
                    activeType="result_card"
                    template={selectedTemplate}
                    customStudents={filteredRows.map((r) => ({
                        _id: r._id,
                        first_name: r.student_name.split(" ")[0] || r.student_name,
                        last_name: r.student_name.split(" ").slice(1).join(" ") || "",
                        roll_no: r.admission_no || "N/A",
                        registration_no: r.admission_no || "N/A",
                        class_name: r.class_name || "N/A",
                        section: "A",
                        father_name: `Father of ${r.student_name}`,
                        marks: String(r.obtained_marks),
                        grade: r.grade || "A",
                        percentage: String(Math.round((r.obtained_marks / (r.max_marks || 100)) * 100)),
                        fee_amount: "—",
                        due_date: "—",
                        course_name: r.exam_title || "General Curriculum",
                        issue_date: new Date(r.graded_at || Date.now()).toLocaleDateString()
                    }))}
                />
            )}
        </div>
    );
}
