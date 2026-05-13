// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import {
    AcademicYearModel,
    AnnouncementDocModel,
    AttendanceModel,
    ClassModel,
    ExamModel,
    FeeModel,
    FeePaymentModel,
    HomeworkModel,
    ParentModel,
    ResultModel,
    StudentModel,
    SubjectModel,
    UserModel,
} from "../models";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";

type ParentStudentDoc = {
    _id: unknown;
    admission_no: string;
    first_name: string;
    last_name: string;
    class_id: any;
    section?: string;
    status?: string;
    guardian?: {
        name?: string;
        phone?: string;
        email?: string;
    };
    user_id?: any;
    date_of_birth?: Date | string | null;
};

function safeString(value: unknown, fallback = "") {
    return value === null || value === undefined ? fallback : String(value);
}

function titleCase(value: string) {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function toDateString(value: unknown) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? safeString(value) : date.toISOString().split("T")[0];
}

function getGradeFromPercentage(percentage: number) {
    if (percentage >= 95) return "A+";
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B+";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
}

async function resolveLinkedStudents(ctx: RequestContext, studentId?: string) {
    let linkedIds: string[] = [];

    if (ctx.role === "parent") {
        const links = await ParentModel.find(tenantFilter(ctx, { user_id: ctx.user_id, status: "active" }))
            .select("student_id")
            .lean();
        linkedIds = links.map((link) => String(link.student_id));
    } else if (ctx.role === "student") {
        if (!Types.ObjectId.isValid(ctx.user_id)) {
            throw new ControlledError("UNAUTHORIZED", "Invalid session identity.", 401);
        }
        const student = await StudentModel.findOne(tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })).select("_id").lean();
        if (student) {
            linkedIds = [String(student._id)];
        }
    } else {
        throw new ControlledError("FORBIDDEN", "Unauthorized access to student portal.", 403);
    }

    if (linkedIds.length === 0) {
        throw new ControlledError("NOT_FOUND", "No linked student profiles found.", 404);
    }

    if (studentId) {
        if (!linkedIds.includes(studentId)) {
            throw new ControlledError("FORBIDDEN", "You do not have permission to view this student's data.", 403);
        }
        linkedIds = [studentId];
    }

    const students = (await StudentModel.find(tenantFilter(ctx, { _id: { $in: linkedIds } }))
        .populate({ path: "class_id", select: "name section academic_year_id subject_ids subjects grade_thresholds" })
        .populate({ path: "user_id", select: "email" })
        .lean()) as ParentStudentDoc[];

    if (students.length === 0) {
        throw new ControlledError("NOT_FOUND", "No student profiles found.", 404);
    }

    return students;
}

async function resolveStudentAcademicYear(student: ParentStudentDoc) {
    const classDoc = student.class_id as { academic_year_id?: any; academic_year?: string } | undefined;
    if (!classDoc?.academic_year_id) {
        return null;
    }

    if (typeof classDoc.academic_year_id === "object" && classDoc.academic_year_id?.year) {
        return classDoc.academic_year_id;
    }

    const record = await AcademicYearModel.findOne({ _id: classDoc.academic_year_id }).lean();
    return record ?? null;
}

async function resolveSubjectsForStudent(ctx: RequestContext, student: ParentStudentDoc) {
    const classDoc = student.class_id as { subject_ids?: unknown[]; subjects?: string[] } | undefined;
    if (!classDoc?.subject_ids?.length) {
        return (classDoc?.subjects ?? []).map((item, index) => ({ 
            id: `${index}`, 
            name: typeof item === "string" ? item : (item as any)?.name || "Unknown" 
        }));
    }

    const subjects = await SubjectModel.find(tenantFilter(ctx, { _id: { $in: classDoc.subject_ids } }))
        .select("name code")
        .lean();

    return subjects.map((subject: any) => ({
        id: String(subject._id),
        name: subject.name,
        code: subject.code ?? ""
    }));
}

function studentDisplayName(student: ParentStudentDoc) {
    return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
}

function classDisplayName(student: ParentStudentDoc) {
    const classDoc = student.class_id as { name?: string; section?: string } | undefined;
    const section = classDoc?.section ? `-${classDoc.section}` : student.section ? `-${student.section}` : "";
    return `${classDoc?.name ?? ""}${section}`.trim();
}

function examTotalPossible(exam: any, classId: string) {
    const subjectCount = (exam.schedule || []).filter((row: any) => String(row.class_id?._id ?? row.class_id) === String(classId)).length;
    return Number(exam.max_marks ?? 0) * Math.max(1, subjectCount || 1);
}

function resolveWorkingDays(records: Array<{ date?: Date | string }>) {
    const unique = new Set<string>();
    for (const record of records) {
        unique.add(toDateString(record.date));
    }
    return unique.size;
}

function monthName(dateValue: Date | string) {
    const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue));
    return date.toLocaleString("en-US", { month: "long" });
}

function calculateTrend(previous: number, current: number) {
    if (current > previous) return "improving";
    if (current < previous) return "declining";
    return "stable";
}

function safePercentage(numerator: number, denominator: number) {
    return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

async function buildResultBreakdown(ctx: RequestContext, student: ParentStudentDoc) {
    const classId = String((student.class_id as any)?._id ?? student.class_id);
    const results = await ResultModel.find(tenantFilter(ctx, { student_id: student._id }))
        .populate({ path: "exam_id", populate: [{ path: "schedule.subject_id", select: "name code" }, { path: "schedule.class_id", select: "name section" }] })
        .populate("class_id", "name grade_thresholds")
        .sort({ graded_at: 1, created_at: 1 })
        .lean();

    const mapped = [] as Array<any>;

    for (const result of results as any[]) {
        const exam = result.exam_id as any;
        const scheduleRows = Array.isArray(exam?.schedule) ? exam.schedule : [];
        const studentMarks = (exam?.marks || []).filter((mark: any) => String(mark.student_id) === String(student._id));
        const totalPossible = examTotalPossible(exam, classId);
        const percentage = safePercentage(Number(result.obtained_marks ?? 0), totalPossible);

        const subjectDetails = studentMarks.map((mark: any) => {
            const subjectSchedule = scheduleRows.find((row: any) => String(row.subject_id?._id ?? row.subject_id) === String(mark.subject_id));
            const subjectMarksForClass = (exam?.marks || []).filter((other: any) => String(other.subject_id) === String(mark.subject_id));
            const values = subjectMarksForClass.map((other: any) => Number(other.marks_obtained ?? 0));
            const classAverage = values.length > 0 ? Number((values.reduce((sum: number, value: number) => sum + value, 0) / values.length).toFixed(1)) : 0;
            const highest = values.length > 0 ? Math.max(...values) : 0;
            const lowest = values.length > 0 ? Math.min(...values) : 0;
            const subjectMarks = Number(mark.marks_obtained ?? 0);
            const subjectPercentage = safePercentage(subjectMarks, Number(exam.max_marks ?? 0));

            return {
                subject: subjectSchedule?.subject_id?.name || "",
                total_marks: Number(exam.max_marks ?? 0),
                marks_obtained: subjectMarks,
                percentage: subjectPercentage,
                grade: getGradeFromPercentage(subjectPercentage),
                class_average: classAverage,
                highest,
                lowest
            };
        });

        const rankRows = await ResultModel.find(tenantFilter(ctx, { exam_id: new Types.ObjectId(String(exam._id)), class_id: new Types.ObjectId(classId) }))
            .select("student_id obtained_marks")
            .lean();
        const sorted = [...rankRows]
            .map((row: any) => ({ student_id: String(row.student_id), percentage: safePercentage(Number(row.obtained_marks ?? 0), totalPossible) }))
            .sort((left, right) => right.percentage - left.percentage);
        const position = Math.max(1, sorted.findIndex((entry) => entry.student_id === String(student._id)) + 1);

        mapped.push({
            exam_id: String(exam?._id ?? result.exam_id),
            exam_name: exam?.title || exam?.name || "",
            exam_date: toDateString(exam?.exam_date ?? exam?.starts_at ?? result.graded_at),
            total_marks: totalPossible,
            marks_obtained: Number(result.obtained_marks ?? 0),
            percentage,
            overall_grade: result.grade || getGradeFromPercentage(percentage),
            position,
            total_students: sorted.length,
            subject_details: subjectDetails
        });
    }

    return mapped;
}

export async function listLinkedStudents(ctx: RequestContext): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const students = await resolveLinkedStudents(ctx);

        return {
            students: await Promise.all(
                students.map(async (student) => ({
                    id: String(student._id),
                    name: studentDisplayName(student),
                    roll_no: student.admission_no,
                    class: classDisplayName(student),
                    section: student.section ?? (student.class_id as any)?.section ?? "",
                    status: student.status ?? "active",
                    academic_year: (await resolveStudentAcademicYear(student))?.year ?? ""
                }))
            )
        };
    });
}

export async function getStudentInfo(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const academicYear = await resolveStudentAcademicYear(student);
        const subjects = await resolveSubjectsForStudent(ctx, student);
        const user = student.user_id ? await UserModel.findOne({ _id: student.user_id }).select("email").lean() : null;

        return {
            student: {
                id: String(student._id),
                name: studentDisplayName(student),
                roll_no: student.admission_no,
                email: user?.email ?? student.guardian?.email ?? "",
                phone: student.guardian?.phone ?? "",
                date_of_birth: student.date_of_birth ? toDateString(student.date_of_birth) : null,
                class: classDisplayName(student),
                section: student.section ?? (student.class_id as any)?.section ?? "",
                academic_year: academicYear?.year ?? "",
                status: student.status ?? "active"
            },
            guardian: {
                name: student.guardian?.name ?? "",
                relationship: "Guardian",
                phone: student.guardian?.phone ?? "",
                email: student.guardian?.email ?? ""
            },
            enrolled_subjects: subjects
        };
    });
}

export async function getChildProfile(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return getStudentInfo(ctx, studentId);
}

export async function getDashboardStats(ctx: RequestContext): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "reports", "view");
        const students = await resolveLinkedStudents(ctx);

        const childrenOverview = await Promise.all(
            students.map(async (student) => {
                const classId = String((student.class_id as any)?._id ?? student.class_id);
                const academicYear = await resolveStudentAcademicYear(student);

                const attendanceRecords = await AttendanceModel.find(tenantFilter(ctx, { student_id: student._id }))
                    .select("date status")
                    .lean();
                const attendancePercentage = safePercentage(
                    attendanceRecords.filter((row: any) => row.status === "present" || row.status === "late").length,
                    Math.max(1, resolveWorkingDays(attendanceRecords as any[]))
                );

                const feeRows = await FeeModel.find(tenantFilter(ctx, { student_id: student._id })).select("amount paid_amount adjustment_amount").lean();
                const pendingFees = feeRows.reduce((sum, fee: any) => {
                    const total = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
                    return sum + Math.max(0, total - Number(fee.paid_amount ?? 0));
                }, 0);

                const homeworkRows = await HomeworkModel.find(tenantFilter(ctx, { class_id: classId }))
                    .select("due_at status submissions")
                    .lean();
                const pendingAssignments = homeworkRows.filter((homework: any) => {
                    const submission = Array.isArray(homework.submissions)
                        ? homework.submissions.find((item: any) => String(item.student_id) === String(student._id))
                        : null;
                    if (submission && ["submitted", "late"].includes(submission.status)) {
                        return false;
                    }
                    return new Date(String(homework.due_at)) >= new Date() || !submission;
                }).length;

                const latestResult = await ResultModel.findOne(tenantFilter(ctx, { student_id: student._id }))
                    .sort({ graded_at: -1, created_at: -1 })
                    .lean();
                const currentGrade = latestResult?.grade || "N/A";

                return {
                    student_id: String(student._id),
                    name: studentDisplayName(student),
                    class: classDisplayName(student),
                    current_grade: currentGrade,
                    attendance_percentage: attendancePercentage,
                    pending_fees: pendingFees,
                    pending_assignments: pendingAssignments,
                    academic_year: academicYear?.year ?? ""
                };
            })
        );

        const totalPendingFees = childrenOverview.reduce((sum, child) => sum + Number(child.pending_fees ?? 0), 0);
        const totalAssignmentsPending = childrenOverview.reduce((sum, child) => sum + Number(child.pending_assignments ?? 0), 0);
        const alertsCount = childrenOverview.filter((child) => Number(child.pending_fees ?? 0) > 0 || Number(child.pending_assignments ?? 0) > 0 || Number(child.attendance_percentage ?? 0) < 90).length;

        return {
            dashboard: {
                total_children: childrenOverview.length,
                children_overview: childrenOverview,
                summary: {
                    total_pending_fees: totalPendingFees,
                    total_assignments_pending: totalAssignmentsPending,
                    alerts_count: alertsCount
                }
            }
        };
    });
}

export async function getStudentResultsReport(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const academicYear = await resolveStudentAcademicYear(student);
        const examResults = await buildResultBreakdown(ctx, student);

        return {
            student: studentDisplayName(student),
            class: classDisplayName(student),
            current_academic_year: academicYear?.year ?? "",
            exam_results: examResults
        };
    });
}

export async function getGradesSummary(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const results = await buildResultBreakdown(ctx, student);
        const latest = results[results.length - 1];

        const subjectGrades = Object.fromEntries(
            (latest?.subject_details ?? []).map((subject: any) => [subject.subject, subject.grade])
        );

        return {
            student: studentDisplayName(student),
            current_grade: latest?.overall_grade ?? "N/A",
            percentage: latest?.percentage ?? 0,
            position: latest ? `${latest.position} out of ${latest.total_students}` : "0 out of 0",
            subjects: subjectGrades
        };
    });
}

export async function getAttendanceReport(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "attendance", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const academicYear = await resolveStudentAcademicYear(student);
        const attendanceRows = (await AttendanceModel.find(tenantFilter(ctx, { student_id: student._id }))
            .sort({ date: -1, createdAt: -1 })
            .lean()) as Array<{ date?: Date | string; status?: string }>;

        const totalWorkingDays = resolveWorkingDays(attendanceRows);
        const presentDays = attendanceRows.filter((row) => row.status === "present").length;
        const absentDays = attendanceRows.filter((row) => row.status === "absent").length;
        const lateDays = attendanceRows.filter((row) => row.status === "late").length;
        const attendancePercentage = safePercentage(presentDays + lateDays, Math.max(1, totalWorkingDays));
        const status = attendancePercentage >= 95 ? "excellent" : attendancePercentage >= 90 ? "good" : attendancePercentage >= 80 ? "average" : "poor";

        const monthWiseBreakdown = attendanceRows.reduce<Record<string, { working_days: number; present: number; absent: number; late: number; percentage: number }>>((acc, row) => {
            const key = monthName(row.date || new Date());
            if (!acc[key]) acc[key] = { working_days: 0, present: 0, absent: 0, late: 0, percentage: 0 };
            acc[key].working_days += 1;
            if (row.status === "present") acc[key].present += 1;
            if (row.status === "absent") acc[key].absent += 1;
            if (row.status === "late") acc[key].late += 1;
            acc[key].percentage = safePercentage(acc[key].present + acc[key].late, acc[key].working_days);
            return acc;
        }, {});

        const recentRecords = attendanceRows.slice(0, 3).map((row) => ({
            date: toDateString(row.date),
            status: row.status ?? ""
        }));

        const recentTwo = attendanceRows.slice(0, 10);
        const earlier = recentTwo.slice(5);
        const recent = recentTwo.slice(0, 5);
        const trend = calculateTrend(
            safePercentage(earlier.filter((row) => row.status === "present" || row.status === "late").length, Math.max(1, earlier.length)),
            safePercentage(recent.filter((row) => row.status === "present" || row.status === "late").length, Math.max(1, recent.length))
        );

        return {
            student: studentDisplayName(student),
            class: classDisplayName(student),
            academic_year: academicYear?.year ?? "",
            attendance_summary: {
                total_working_days: totalWorkingDays,
                present_days: presentDays,
                absent_days: absentDays,
                late_days: lateDays,
                attendance_percentage: attendancePercentage,
                status
            },
            month_wise_breakdown: monthWiseBreakdown,
            recent_records: recentRecords,
            analysis: {
                trend,
                alert: attendancePercentage < 90 ? "Attendance near 90% threshold" : "Attendance healthy"
            }
        };
    });
}

export async function getAttendanceSimple(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return getAttendanceReport(ctx, studentId);
}

export async function getHomeworkReport(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "homework", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const homeworkRows = await HomeworkModel.find(tenantFilter(ctx, { class_id: student.class_id?._id ?? student.class_id }))
            .populate("teacher_id", "first_name last_name")
            .populate("subject_id", "name")
            .sort({ due_at: -1, assigned_at: -1 })
            .lean();

        const homeworkList = homeworkRows.map((homework: any) => {
            const submission = Array.isArray(homework.submissions)
                ? homework.submissions.find((entry: any) => String(entry.student_id) === String(student._id))
                : null;
            const dueDate = new Date(String(homework.due_at));
            const overdue = !submission && dueDate < new Date();

            return {
                id: String(homework._id),
                title: homework.title,
                subject: homework.subject_id?.name || homework.subject || "",
                posted_by: `${homework.teacher_id?.first_name ?? ""} ${homework.teacher_id?.last_name ?? ""}`.trim(),
                posted_date: toDateString(homework.assigned_at),
                due_date: toDateString(homework.due_at),
                status: overdue ? "overdue" : submission ? "pending" : "pending",
                description: homework.instructions || "",
                attachments: homework.attachment_urls ?? [],
                submission_status: submission?.status === "submitted" || submission?.status === "late" ? "submitted" : "not_submitted",
                submission_date: submission?.submitted_at ? toDateString(submission.submitted_at) : null
            };
        });

        const summary = {
            total_assignments: homeworkList.length,
            pending: homeworkList.filter((item) => item.submission_status === "not_submitted" && item.status !== "overdue").length,
            completed: homeworkList.filter((item) => item.submission_status === "submitted").length,
            overdue: homeworkList.filter((item) => item.status === "overdue").length
        };

        return {
            student: studentDisplayName(student),
            homework_list: homeworkList,
            summary
        };
    });
}

export async function getPerformanceChart(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const academicYear = await resolveStudentAcademicYear(student);
        const results = await ResultModel.find(tenantFilter(ctx, { student_id: student._id }))
            .populate({ path: "exam_id", populate: [{ path: "schedule.subject_id", select: "name" }] })
            .populate("class_id", "name grade_thresholds")
            .sort({ graded_at: 1, created_at: 1 })
            .lean();

        const performanceHistory = results.map((result: any) => {
            const exam = result.exam_id as any;
            const totalPossible = examTotalPossible(exam, String((student.class_id as any)?._id ?? student.class_id));
            const percentage = safePercentage(Number(result.obtained_marks ?? 0), totalPossible);
            return {
                exam: exam?.title || exam?.name || "",
                date: toDateString(exam?.exam_date ?? exam?.starts_at ?? result.graded_at),
                percentage,
                grade: result.grade || getGradeFromPercentage(percentage)
            };
        });

        const current = performanceHistory[performanceHistory.length - 1] ?? null;
        const previous = performanceHistory[performanceHistory.length - 2] ?? current;
        const trend = current && previous ? calculateTrend(previous.percentage, current.percentage) : "stable";
        const trendDelta = current && previous ? Number((current.percentage - previous.percentage).toFixed(1)) : 0;

        const subjectPerformance: Record<string, { percentage: number; grade: string; trend: string }> = {};
        const subjectHistory = new Map<string, number[]>();
        for (const result of results as any[]) {
            const exam = result.exam_id as any;
            const marks = Array.isArray(exam?.marks) ? exam.marks : [];
            const studentMarks = marks.filter((mark: any) => String(mark.student_id) === String(student._id));
            for (const mark of studentMarks) {
                const subjectName = (exam.schedule || []).find((row: any) => String(row.subject_id?._id ?? row.subject_id) === String(mark.subject_id))?.subject_id?.name || "";
                if (!subjectHistory.has(subjectName)) subjectHistory.set(subjectName, []);
                subjectHistory.get(subjectName)!.push(safePercentage(Number(mark.marks_obtained ?? 0), Number(exam.max_marks ?? 0)));
            }
        }
        for (const [subject, values] of subjectHistory.entries()) {
            const average = values.length > 0 ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0;
            const last = values[values.length - 1] ?? average;
            const prev = values[values.length - 2] ?? last;
            subjectPerformance[subject] = {
                percentage: average,
                grade: getGradeFromPercentage(average),
                trend: calculateTrend(prev, last)
            };
        }

        const latestExam = results[results.length - 1] as any;
        const latestClassResults = latestExam
            ? await ResultModel.find(tenantFilter(ctx, { exam_id: latestExam.exam_id?._id ?? latestExam.exam_id, class_id: (student.class_id as any)?._id ?? student.class_id }))
                .populate("student_id", "first_name last_name")
                .lean()
            : [];
        const latestTotalPossible = latestExam ? examTotalPossible(latestExam.exam_id, String((student.class_id as any)?._id ?? student.class_id)) : 0;
        const sortedByMarks = [...latestClassResults]
            .map((row: any) => safePercentage(Number(row.obtained_marks ?? 0), latestTotalPossible))
            .sort((left, right) => right - left);
        const studentAverage = current?.percentage ?? 0;
        const classAverage = sortedByMarks.length > 0 ? Number((sortedByMarks.reduce((sum, value) => sum + value, 0) / sortedByMarks.length).toFixed(1)) : 0;
        const position = current ? Math.max(1, (latestClassResults as any[]).findIndex((row) => String(row.student_id?._id ?? row.student_id) === String(student._id)) + 1) : 1;
        const percentile = sortedByMarks.length > 0 ? Math.round((1 - (position - 1) / sortedByMarks.length) * 100) : 0;

        return {
            student: studentDisplayName(student),
            performance_analysis: {
                current_percentage: current?.percentage ?? 0,
                previous_exam_percentage: previous?.percentage ?? 0,
                trend,
                trend_percentage: `${trendDelta >= 0 ? "+" : ""}${trendDelta}%`
            },
            performance_history: performanceHistory,
            subject_performance: subjectPerformance,
            class_comparison: {
                student_average: studentAverage,
                class_average: classAverage,
                position,
                percentile
            },
            academic_year: academicYear?.year ?? ""
        };
    });
}

export async function listAnnouncementsForParent(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "announcements", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];

        const announcements = await AnnouncementDocModel.find(tenantFilter(ctx))
            .populate("created_by", "first_name last_name")
            .sort({ created_at: -1 })
            .lean();

        return {
            student: studentDisplayName(student),
            announcements: announcements.map((announcement: any) => ({
                id: String(announcement._id),
                title: announcement.title,
                content: announcement.message,
                posted_date: toDateString(announcement.created_at),
                posted_by: `${announcement.created_by?.first_name ?? "School"} ${announcement.created_by?.last_name ?? "Administration"}`.trim(),
                priority: "normal",
                category: "general",
                attachments: []
            }))
        };
    });
}

export async function listAcademicYearsForParent(ctx: RequestContext): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "settings", "view");
        const academicYears = await AcademicYearModel.find(tenantFilter(ctx))
            .sort({ start_date: -1 })
            .lean();

        return {
            academic_years: academicYears.map((year: any) => ({
                id: String(year._id),
                name: year.year,
                start_date: toDateString(year.start_date),
                end_date: toDateString(year.end_date),
                is_active: Boolean(year.is_active)
            }))
        };
    });
}

export async function getFeesReport(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];

        const feeRows = await FeeModel.find(tenantFilter(ctx, { student_id: student._id }))
            .populate("fee_type_id", "name")
            .populate("class_id", "name section")
            .sort({ due_at: 1, created_at: 1 })
            .lean();

        const payments = await FeePaymentModel.find(tenantFilter(ctx, { student_id: student._id }))
            .sort({ payment_date: 1, created_at: 1 })
            .lean();

        const paymentByFee = new Map<string, any>();
        for (const payment of payments as any[]) {
            for (const allocation of payment.allocations || []) {
                if (allocation.fee_id) {
                    paymentByFee.set(String(allocation.fee_id), payment);
                }
            }
        }

        const feeDetails = feeRows.map((fee: any) => {
            const total = Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0);
            const paid = Number(fee.paid_amount ?? 0);
            const payment = paymentByFee.get(String(fee._id));
            return {
                fee_type: fee.fee_type_id?.name || fee.title,
                amount: total,
                due_date: toDateString(fee.due_at),
                status: paid >= total ? "paid" : paid > 0 ? "partial" : "pending",
                payment_date: payment?.payment_date ? toDateString(payment.payment_date) : null,
                receipt_no: payment?.receipt_no ?? null
            };
        });

        const paymentHistory = payments.map((payment: any) => ({
            receipt_no: payment.receipt_no,
            date: toDateString(payment.payment_date),
            amount: Number(payment.amount ?? 0),
            fee_type: (payment.allocations || []).map((allocation: any) => allocation.fee_type_id ? safeString(allocation.fee_type_id) : titleCase(String(allocation.month ?? ""))).join(", "),
            method: payment.payment_method,
            status: payment.status ?? "completed"
        }));

        const totalFee = feeRows.reduce((sum: number, fee: any) => sum + Number(fee.amount ?? 0) + Number(fee.adjustment_amount ?? 0), 0);
        const collected = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
        const pending = Math.max(0, totalFee - collected);

        return {
            student: studentDisplayName(student),
            class: classDisplayName(student),
            academic_year: (await resolveStudentAcademicYear(student))?.year ?? "",
            fee_summary: {
                total_fee: totalFee,
                collected,
                pending,
                percentage_paid: safePercentage(collected, totalFee),
                status: pending > 0 ? "due" : "paid"
            },
            fee_details: feeDetails,
            payment_history: paymentHistory,
            due_notices: feeDetails.filter((fee) => fee.status !== "paid" && new Date(String(fee.due_date)) <= new Date()).map((fee) => ({
                fee_type: fee.fee_type,
                due_amount: fee.amount,
                due_date: fee.due_date,
                days_overdue: Math.max(0, Math.floor((Date.now() - new Date(String(fee.due_date)).getTime()) / (1000 * 60 * 60 * 24)))
            }))
        };
    });
}

export async function getPaymentHistory(ctx: RequestContext, studentId?: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "fees", "view");
        const students = await resolveLinkedStudents(ctx, studentId);
        const student = students[0];
        const payments = await FeePaymentModel.find(tenantFilter(ctx, { student_id: student._id }))
            .sort({ payment_date: 1, created_at: 1 })
            .lean();

        const feeTypes = await FeeModel.find(tenantFilter(ctx, { student_id: student._id }))
            .populate("fee_type_id", "name")
            .lean();

        const feeTypeById = new Map<string, string>();
        for (const fee of feeTypes as any[]) {
            if (fee.fee_type_id?.name) feeTypeById.set(String(fee._id), fee.fee_type_id.name);
        }

        const paymentHistory = payments.map((payment: any) => ({
            receipt_no: payment.receipt_no,
            date: toDateString(payment.payment_date),
            amount: Number(payment.amount ?? 0),
            fee_types: Array.from(new Set((payment.allocations || []).map((allocation: any) => {
                if (allocation.fee_type_id) return feeTypeById.get(String(allocation.fee_id)) ?? safeString(allocation.fee_type_id);
                return titleCase(String(allocation.month ?? ""));
            }))),
            payment_method: payment.payment_method,
            status: payment.status ?? "completed"
        }));

        const totalPaid = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
        const averageAmount = payments.length > 0 ? Number((totalPaid / payments.length).toFixed(1)) : 0;

        return {
            student: studentDisplayName(student),
            payment_history: paymentHistory,
            total_paid: totalPaid,
            payment_summary: {
                total_payments: payments.length,
                average_amount: averageAmount
            }
        };
    });
}
