// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { AttendanceModel } from "../models/attendance.model";
import { ClassModel } from "../models/class.model";
import { ParentModel } from "../models/parent.model";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import {
    attendanceBulkMarkSchema,
    attendanceDateSchema,
    attendanceStatusSchema,
    type AttendanceBulkMarkInput
} from "../validation/attendance.schema";
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";
import { writeAuditLog } from "./audit.service";

type AttendanceListFilter = {
    class_id?: string;
    student_id?: string;
    Academy_year_id?: string;
    date?: string;
};

type AttendanceRecord = {
    _id: unknown;
    student_id: unknown;
    class_id: unknown;
    student_name?: string;
    admission_no?: string;
    class_name?: string;
    date: Date | string;
    status: string;
    note?: string;
    marked_by?: unknown;
    teacher_id?: unknown;
};

type AttendanceClassSummary = {
    id: string;
    name: string;
    total_students: number;
    marked_today: number;
    percentage: number;
    status: "complete" | "incomplete";
};

type ParentAttendanceStudent = {
    student_id: string;
    student_name: string;
    class_name: string;
    total_present: number;
    total_absent: number;
    total_excused: number;
    percentage: number;
    recent_records: Array<{ date: string; status: string }>;
};

function normalizeDate(value: string | Date): Date {
    const parsed = value instanceof Date ? new Date(value) : attendanceDateSchema.parse(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new ControlledError("VALIDATION_ERROR", "Invalid date format, use YYYY-MM-DD.", 400);
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

async function resolveTeacherClassIds(ctx: RequestContext): Promise<Types.ObjectId[]> {
    const teacher = (await TeacherModel.findOne(
        tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })
    )
        .select("_id class_ids")
        .lean()) as { _id?: unknown; class_ids?: unknown[] } | null;

    if (!teacher?.class_ids?.length) {
        return [];
    }

    return teacher.class_ids.map((id) => new Types.ObjectId(String(id)));
}

async function resolveTeacherProfileId(ctx: RequestContext): Promise<Types.ObjectId | null> {
    const teacher = (await TeacherModel.findOne(
        tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })
    )
        .select("_id")
        .lean()) as { _id?: unknown } | null;

    return teacher?._id ? new Types.ObjectId(String(teacher._id)) : null;
}

async function resolveActiveAcademicYearId(ctx: RequestContext): Promise<string | null> {
    const active = (await AcademicYearModel.findOne(
        tenantFilter(ctx, { is_active: true, status: "active" })
    )
        .select("_id")
        .lean()) as { _id?: unknown } | null;

    return active?._id ? String(active._id) : null;
}

function hasClassAccess(classIds: Types.ObjectId[], classId: string): boolean {
    return classIds.some((id) => String(id) === classId);
}

function toPlainAttendanceRecord(row: AttendanceRecord) {
    const student = row.student_id as {
        _id?: unknown;
        admission_no?: string;
        first_name?: string;
        last_name?: string;
    };
    const classroom = row.class_id as { _id?: unknown; name?: string };

    return {
        ...row,
        _id: String(row._id),
        student_id: student?._id ? String(student._id) : String(row.student_id),
        class_id: classroom?._id ? String(classroom._id) : String(row.class_id),
        student_name: `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim(),
        admission_no: student?.admission_no ?? "",
        class_name: classroom?.name ?? "",
        marked_by: row.marked_by ? String(row.marked_by) : undefined,
        teacher_id: row.teacher_id ? String(row.teacher_id) : undefined,
        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date
    };
}

export async function listAttendance(
    ctx: RequestContext,
    filter: AttendanceListFilter = {}
): Promise<ServiceResult<unknown[]>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "attendance", "view");
        const query: Record<string, unknown> = tenantFilter(ctx);

        if (filter.date) {
            query.date = normalizeDate(filter.date);
        }

        let academicYearId = filter.academic_year_id || filter.Academy_year_id;
        if (!academicYearId || academicYearId === "undefined") {
            const { resolveAcademicYearId } = await import("./_academic-year-filter");
            academicYearId = await resolveAcademicYearId(ctx);
        }

        if (academicYearId) {
            query.academic_year_id = new Types.ObjectId(academicYearId);
        }

        let classIds = await resolveClassIdsForAcademicYear(ctx, academicYearId);

        if (ctx.role === "teacher") {
            const teacherClassIds = await resolveTeacherClassIds(ctx);
            classIds = classIds.length > 0 ? classIds.filter((id) => teacherClassIds.some((teacherId) => String(teacherId) === String(id))) : teacherClassIds;
        }

        if (ctx.role === "parent") {
            const parentStudentIds = (await ParentModel.find(
                tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id), status: "active" })
            )
                .select("student_id")
                .lean()) as Array<{ student_id?: unknown }>;
            const allowedStudentIds = parentStudentIds.map((item) => new Types.ObjectId(String(item.student_id)));

            if (filter.student_id && !allowedStudentIds.some((id) => String(id) === filter.student_id)) {
                throw new ControlledError("FORBIDDEN", "You can only view your own child's attendance.", 403);
            }

            query.student_id = filter.student_id
                ? new Types.ObjectId(filter.student_id)
                : { $in: allowedStudentIds };

            const rows = await AttendanceModel.find(query)
                .populate("student_id", "admission_no first_name last_name class_id")
                .populate("class_id", "name")
                .sort({ date: -1, createdAt: -1 })
                .lean();

            return rows.map((row) => toPlainAttendanceRecord(row as any));
        }

        if (filter.class_id) {
            if (ctx.role === "teacher" && !hasClassAccess(classIds, filter.class_id)) {
                throw new ControlledError("FORBIDDEN", "You can only view attendance for assigned classes.", 403);
            }
            query.class_id = new Types.ObjectId(filter.class_id);
        } else if (classIds.length > 0) {
            query.class_id = { $in: classIds };
        }

        if (filter.student_id) {
            query.student_id = new Types.ObjectId(filter.student_id);
        }

        const rows = await AttendanceModel.find(query)
            .populate("student_id", "admission_no first_name last_name class_id")
            .populate("class_id", "name")
            .sort({ date: -1, createdAt: -1 })
            .lean();

        return rows.map((row) => toPlainAttendanceRecord(row as any));
    });
}

export async function markAttendanceBatch(
    ctx: RequestContext,
    input: AttendanceBulkMarkInput
): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "attendance", "create");

        const parsed = attendanceBulkMarkSchema.parse(input);
        const attendanceDate = normalizeDate(parsed.date);

        const classroom = (await ClassModel.findOne(
            tenantFilter(ctx, { _id: parsed.class_id })
        )
            .select("_id name Academy_year_id")
            .lean()) as { _id?: unknown; name?: string; Academy_year_id?: unknown } | null;

        if (!classroom?._id) {
            throw new ControlledError("NOT_FOUND", "Selected class was not found.", 404);
        }

        if (parsed.academic_year_id) {
            const expectedAcademicYearId = String(classroom.Academy_year_id ?? "");
            if (expectedAcademicYearId && expectedAcademicYearId !== parsed.academic_year_id) {
                throw new ControlledError("BAD_REQUEST", "Selected class does not belong to the selected academic year.", 400);
            }
        } else if (!classroom.Academy_year_id) {
            parsed.academic_year_id = await resolveActiveAcademicYearId(ctx) ?? undefined;
        }

        if (ctx.role === "teacher") {
            const teacherClassIds = await resolveTeacherClassIds(ctx);
            if (!hasClassAccess(teacherClassIds, parsed.class_id)) {
                throw new ControlledError("FORBIDDEN", "You can only mark attendance for assigned classes.", 403);
            }
        }

        const activeStudents = (await StudentModel.find(
            tenantFilter(ctx, {
                class_id: new Types.ObjectId(parsed.class_id),
                status: "active"
            })
        )
            .select("_id class_id first_name last_name admission_no section")
            .lean()) as Array<{
                _id?: unknown;
                class_id?: unknown;
                first_name?: string;
                last_name?: string;
                admission_no?: string;
                section?: string;
            }>;

        const teacherId = ctx.role === "teacher" ? await resolveTeacherProfileId(ctx) : null;
        const allowedStudentIds = new Set(activeStudents.map((student) => String(student._id)));
        const entries = Object.entries(parsed.records);
        let saved = 0;
        let failed = 0;
        const failedRecords: Array<{ student_id: string; reason: string }> = [];

        for (const [studentId, status] of entries) {
            if (!allowedStudentIds.has(studentId)) {
                failed += 1;
                failedRecords.push({ student_id: studentId, reason: "Student is not active in the selected class." });
                continue;
            }

            const statusResult = attendanceStatusSchema.safeParse(status);
            if (!statusResult.success) {
                failed += 1;
                failedRecords.push({ student_id: studentId, reason: "Invalid attendance status." });
                continue;
            }

            const updated = await AttendanceModel.findOneAndUpdate(
                tenantFilter(ctx, {
                    student_id: new Types.ObjectId(studentId),
                    date: attendanceDate,
                    period: parsed.period ?? undefined
                }),
                {
                    $set: {
                        school_id: ctx.school_id,
                        teacher_id: teacherId,
                        class_id: new Types.ObjectId(parsed.class_id),
                        student_id: new Types.ObjectId(studentId),
                        date: attendanceDate,
                        period: parsed.period ?? undefined,
                        status: statusResult.data,
                        marked_by: new Types.ObjectId(ctx.user_id),
                        source: "manual"
                    }
                },
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            ).lean();

            if (!updated) {
                failed += 1;
                failedRecords.push({ student_id: studentId, reason: "Failed to save attendance." });
                continue;
            }

            saved += 1;
        }

        const total = entries.length;

        await writeAuditLog(ctx, {
            action: "create",
            entity_type: "attendance",
            entity_id: String(classroom._id),
            metadata: {
                scope: "attendance_batch",
                class_id: parsed.class_id,
                academic_year_id: parsed.academic_year_id ?? String(classroom.Academy_year_id ?? ""),
                date: attendanceDate.toISOString().split("T")[0],
                total,
                saved,
                failed
            }
        });

        return {
            message: "Attendance saved successfully",
            saved,
            failed,
            total,
            failed_records: failedRecords
        };
    });
}

export async function getTeacherAttendanceSummary(
    ctx: RequestContext,
    date?: string
): Promise<ServiceResult<{ date: string; classes: AttendanceClassSummary[] }>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "attendance", "view");

        const attendanceDate = normalizeDate(date ? date : new Date().toISOString().split("T")[0]);
        const teacherClassIds = await resolveTeacherClassIds(ctx);

        if (!teacherClassIds.length) {
            return { date: attendanceDate.toISOString().split("T")[0], classes: [] };
        }

        const classes = (await ClassModel.find(
            tenantFilter(ctx, { _id: { $in: teacherClassIds } })
        )
            .select("_id name")
            .sort({ name: 1 })
            .lean()) as Array<{ _id?: unknown; name?: string }>;

        const summaries = await Promise.all(
            classes.map(async (classroom) => {
                const classId = String(classroom._id);
                const totalStudents = await StudentModel.countDocuments(
                    tenantFilter(ctx, { class_id: new Types.ObjectId(classId), status: "active" })
                );
                const markedToday = await AttendanceModel.countDocuments(
                    tenantFilter(ctx, { class_id: new Types.ObjectId(classId), date: attendanceDate })
                );
                const percentage = totalStudents === 0 ? 0 : Math.round((markedToday / totalStudents) * 100);

                return {
                    id: classId,
                    name: classroom.name ?? "",
                    total_students: totalStudents,
                    marked_today: markedToday,
                    percentage,
                    status: markedToday >= totalStudents && totalStudents > 0 ? ("complete" as const) : ("incomplete" as const)
                };
            })
        );

        return {
            date: attendanceDate.toISOString().split("T")[0],
            classes: summaries
        };
    });
}

export async function getParentAttendance(
    ctx: RequestContext
): Promise<ServiceResult<{ students: ParentAttendanceStudent[] }>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "attendance", "view");

        if (ctx.role !== "parent") {
            throw new ControlledError("FORBIDDEN", "Only parents can view this report.", 403);
        }

        const parentLinks = (await ParentModel.find(
            tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id), status: "active" })
        )
            .populate({ path: "student_id", select: "_id first_name last_name class_id admission_no section status" })
            .lean()) as Array<{
                student_id?: {
                    _id?: unknown;
                    first_name?: string;
                    last_name?: string;
                    class_id?: unknown;
                    admission_no?: string;
                    section?: string;
                    status?: string;
                };
            }>;

        const students = await Promise.all(
            parentLinks.map(async (link) => {
                const student = link.student_id;
                if (!student?._id) {
                    return null;
                }

                const classInfo = (await ClassModel.findOne(
                    tenantFilter(ctx, { _id: new Types.ObjectId(String(student.class_id)) })
                )
                    .select("name")
                    .lean()) as { name?: string } | null;

                const attendanceRows = (await AttendanceModel.find(
                    tenantFilter(ctx, { student_id: new Types.ObjectId(String(student._id)) })
                )
                    .sort({ date: -1, createdAt: -1 })
                    .lean()) as Array<{ date?: Date | string; status?: string }>;

                const totalPresent = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;
                const totalAbsent = attendanceRows.filter((row) => row.status === "absent").length;
                const totalExcused = attendanceRows.filter((row) => row.status === "excused").length;
                const totalMarked = attendanceRows.length;
                const percentage = totalMarked === 0 ? 0 : Math.round((totalPresent / totalMarked) * 1000) / 10;

                return {
                    student_id: String(student._id),
                    student_name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
                    class_name: classInfo?.name ?? "",
                    total_present: totalPresent,
                    total_absent: totalAbsent,
                    total_excused: totalExcused,
                    percentage,
                    recent_records: attendanceRows.slice(0, 5).map((row) => ({
                        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date ?? ""),
                        status: row.status ?? ""
                    }))
                } satisfies ParentAttendanceStudent;
            })
        );

        return {
            students: students.filter(Boolean) as ParentAttendanceStudent[]
        };
    });
}

export async function getParentStudentAttendanceReport(
    ctx: RequestContext
): Promise<ServiceResult<{ students: ParentAttendanceStudent[] }>> {
    return getParentAttendance(ctx);
}
