import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "@/components/ui";
import { SchoolShell } from "@/layouts/SchoolShell";
import { useAuth } from "@/hooks/useAuth";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { normalizeStudentInfo, type StudentProfileData } from "../student-info";

type StudentInfoResponse = {
    student: {
        id: string;
        name: string;
        first_name?: string;
        last_name?: string;
        roll_no: string;
        admission_no?: string;
        email: string;
        phone: string;
        date_of_birth: string | null;
        class: string;
        class_name?: string;
        section: string;
        academic_year: string;
        status: string;
    };
    guardian: {
        name: string;
        phone: string;
        email: string;
    };
    enrolled_subjects: Array<{ id: string; name: string }>;
};

type DashboardStatsResponse = {
    dashboard: {
        total_children: number;
        children_overview: Array<{
            student_id: string;
            name: string;
            class: string;
            current_grade: string;
            attendance_percentage: number;
            pending_fees: number;
            pending_assignments: number;
            academic_year: string;
        }>;
        summary: {
            total_pending_fees: number;
            total_assignments_pending: number;
            alerts_count: number;
        };
    };
};

type StudentResultsResponse = {
    student: string;
    class: string;
    current_academic_year: string;
    exam_results: Array<{
        exam_id: string;
        exam_name: string;
        exam_date: string;
        percentage: number;
        overall_grade: string;
        position: number;
        total_students: number;
        subject_details: Array<{ subject: string; percentage: number; grade: string }>;
    }>;
};

type AttendanceResponse = {
    student: string;
    class: string;
    attendance_summary: {
        total_working_days: number;
        present_days: number;
        absent_days: number;
        leave_days: number;
        attendance_percentage: number;
        status: string;
    };
    recent_records: Array<{ date: string; status: string }>;
};

type FeeResponse = {
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

type HomeworkResponse = {
    student: string;
    homework_list: Array<{
        id: string;
        title: string;
        subject: string;
        posted_by: string;
        posted_date: string;
        due_date: string;
        status: string;
        description: string;
        attachments: string[];
        submission_status: string;
        submission_date: string | null;
    }>;
    summary: { total_assignments: number; pending: number; completed: number; overdue: number };
};

type AnnouncementsResponse = {
    student: string;
    announcements: Array<{
        id: string;
        title: string;
        content: string;
        posted_date: string;
        posted_by: string;
        priority: string;
        category: string;
    }>;
};

async function loadStudentId(userStudentId?: string) {
    if (userStudentId) return userStudentId;

    const result = await serviceRequest<{ students: Array<{ id: string }> }>("/api/parent/student-info");
    if (!result.ok) return "";
    return result.data.students?.[0]?.id ?? "";
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
    return (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold normal-case tracking-[0.2em] text-slate-500">{label}</p>
            <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
        </Card>
    );
}

export function StudentDashboardPage() {
    const { user } = useAuth();
    const { state, run } = useSafeAsync<{
        profile: StudentProfileData;
        stats: DashboardStatsResponse | null;
        results: StudentResultsResponse | null;
        attendance: AttendanceResponse | null;
        fees: FeeResponse | null;
        homework: HomeworkResponse | null;
        announcements: AnnouncementsResponse | null;
    }>();

    useEffect(() => {
        void run(async () => {
            const studentId = await loadStudentId(user?.studentId);

            if (!studentId) {
                throw new Error("No student profile is linked to this account.");
            }

            const [profile, stats, results, attendance, fees, homework, announcements] = await Promise.all([
                serviceRequest<unknown>(`/api/parent/student-info?student_id=${studentId}`),
                serviceRequest<DashboardStatsResponse>("/api/parent/dashboard/stats"),
                serviceRequest<StudentResultsResponse>(`/api/parent/student-results?student_id=${studentId}`),
                serviceRequest<AttendanceResponse>(`/api/parent/student-attendance?student_id=${studentId}`),
                serviceRequest<FeeResponse>(`/api/parent/fees?student_id=${studentId}`),
                serviceRequest<HomeworkResponse>(`/api/parent/child/homework?student_id=${studentId}`),
                serviceRequest<AnnouncementsResponse>(`/api/parent/child/announcements?student_id=${studentId}`)
            ]);

            if (!profile.ok) {
                throw new Error(profile.error.message || "Failed to load student profile");
            }

            const normalizedProfile = normalizeStudentInfo(profile.data);
            if (!normalizedProfile) {
                throw new Error("Failed to load student profile");
            }

            return {
                profile: normalizedProfile,
                stats: stats.ok ? stats.data : null,
                results: results.ok ? results.data : null,
                attendance: attendance.ok ? attendance.data : null,
                fees: fees.ok ? fees.data : null,
                homework: homework.ok ? homework.data : null,
                announcements: announcements.ok ? announcements.data : null
            };
        }).catch(() => {
            // useSafeAsync already captures the error.
        });
    }, [run, user?.studentId]);

    if (state.status === "idle" || state.status === "loading") {
        return (
            <SchoolShell eyebrow="Parent Portal" title="Parent Dashboard">
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                    <Skeleton className="h-80 w-full" />
                </div>
            </SchoolShell>
        );
    }

    if (state.status === "error" || !state.data) {
        return (
            <SchoolShell eyebrow="Student Portal" title="Dashboard">
                <DataState 
                    variant="empty" 
                    title="No student profile found" 
                    message={state.error || "Your account is not linked to any student record. Please contact your school administrator."} 
                />
            </SchoolShell>
        );
    }

    const profile = state.data.profile;
    const student = profile?.student || {} as any;
    const studentName = student.name || (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : 'Student');
    const className = student.class || student.class_name || '';
    const section = student.section || '';
    const academicYear = student.academic_year || '';
    const status = student.status || 'active';
    const rollNo = student.roll_no || student.admission_no || '—';
    const latestResult = state.data.results?.exam_results?.[0];
    const attendance = state.data.attendance?.attendance_summary;
    const fees = state.data.fees?.fee_summary;
    const homework = state.data.homework?.summary;

    return (
        <SchoolShell eyebrow="Parent Portal" title="Parent Dashboard">
            <div className="space-y-8">
                <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 p-8 text-white shadow-2xl shadow-slate-950/20">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold normal-case tracking-[0.35em] text-cyan-200/80">Welcome back</p>
                            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">{studentName}</h1>
                            <p className="mt-3 text-sm text-slate-200 md:text-base">
                                {className} {section ? `- ${section}` : ""} {academicYear ? `· ${academicYear}` : ""}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
                            <p className="text-xs font-semibold normal-case tracking-[0.25em] text-cyan-100/70">Current status</p>
                            <div className="mt-2 flex items-center gap-3">
                                <Badge variant="success" className="bg-emerald-400/15 text-emerald-100 border-emerald-300/20">
                                    {status}
                                </Badge>
                                <span className="text-sm text-slate-200">Roll No: {rollNo}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Current Grade" value={latestResult?.overall_grade ?? "N/A"} tone="text-cyan-700" />
                    <MetricCard label="Attendance" value={`${attendance?.attendance_percentage ?? 0}%`} tone="text-emerald-700" />
                    <MetricCard label="Pending Fees" value={`Rs ${fees?.pending?.toLocaleString() ?? 0}`} tone="text-amber-700" />
                    <MetricCard label="Pending Homework" value={homework?.pending ?? 0} tone="text-rose-700" />
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                    <Card>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
                                <p className="text-sm text-slate-500">Jump to the most used student portal sections.</p>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            {[
                                ["Profile", "/student/profile", "person"],
                                ["Live Classes", "/student/live-class", "videocam"],
                                ["Live Exams", "/student/live-exam", "live_tv"],
                                ["Results", "/student/results", "leaderboard"],
                                ["Attendance", "/student/attendance", "fact_check"],
                                ["Fees", "/student/fees", "payments"],
                                ["Homework", "/student/homework", "assignment"],
                                ["Announcements", "/student/announcements", "campaign"]
                            ].map(([label, href, icon]) => (
                                <Link
                                    key={href}
                                    to={href}
                                    className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">{label}</p>
                                        <p className="text-xs text-slate-500">Open {label.toLowerCase()} details</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 transition-transform group-hover:translate-x-1">{icon}</span>
                                </Link>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold text-slate-900">Student details</h2>
                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-xs font-semibold normal-case tracking-wide text-slate-400">Guardian</p>
                                <p className="mt-1 font-semibold text-slate-900">{profile?.guardian?.name || "Not set"}</p>
                                <p className="text-sm text-slate-500">{profile?.guardian?.phone || profile?.guardian?.email || "No contact details"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold normal-case tracking-wide text-slate-400">Subjects</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(profile?.enrolled_subjects?.length ?? 0) > 0 ? (
                                        profile.enrolled_subjects.map((subject) => (
                                            <Badge key={subject.id} variant="secondary">
                                                {subject.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-500">No subjects assigned yet.</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold normal-case tracking-wide text-slate-400">Alerts</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {state.data.stats?.dashboard?.summary?.alerts_count ?? 0} alerts, {state.data.stats?.dashboard?.summary?.total_assignments_pending ?? 0} homework items, {state.data.stats?.dashboard?.summary?.total_pending_fees ?? 0} fee balance.
                                </p>
                            </div>
                        </div>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <h2 className="text-xl font-bold text-slate-900">Recent results</h2>
                        <div className="mt-5 space-y-3">
                            {state.data.results?.exam_results?.length ? state.data.results.exam_results.slice(0, 3).map((exam) => (
                                <div key={exam.exam_id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{exam.exam_name}</p>
                                            <p className="text-xs text-slate-500">{exam.exam_date}</p>
                                        </div>
                                        <Badge variant={exam.overall_grade === "A+" || exam.overall_grade === "A" ? "success" : exam.overall_grade === "F" ? "error" : "primary"}>
                                            {exam.overall_grade}
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                                        <span>{exam.percentage}% overall</span>
                                        <span>Position {exam.position} of {exam.total_students}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No published results yet.</p>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-bold text-slate-900">Announcements</h2>
                        <div className="mt-5 space-y-3">
                            {state.data.announcements?.announcements?.length ? state.data.announcements.announcements.slice(0, 3).map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-semibold text-slate-900">{item.title}</p>
                                        <Badge variant={item.priority === "high" ? "error" : "secondary"}>{item.priority}</Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{item.content}</p>
                                    <p className="mt-2 text-xs text-slate-400">{item.posted_date}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No announcements right now.</p>
                            )}
                        </div>
                    </Card>
                </section>
            </div>
        </SchoolShell>
    );
}