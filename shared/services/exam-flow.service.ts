// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel, ClassModel, ExamModel, ParentModel, ResultModel, StudentModel, SubjectModel, TeacherModel } from "../models";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";

type ExamScheduleRow = {
    subject_id: string;
    class_id: string;
    date: string;
    start_time: string;
    end_time: string;
    hall?: string;
};

type MarksGridInput = Record<string, Record<string, number>>;

function toId(value: unknown): string {
    return String((value as { _id?: unknown })?._id ?? value ?? "");
}

function toDateString(value: unknown): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().split("T")[0];
}

function titleCase(value: string): string {
    return value
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function defaultGradeBands() {
    return [
        { grade: "A+", min_marks: 95, max_marks: 100 },
        { grade: "A", min_marks: 90, max_marks: 94 },
        { grade: "B+", min_marks: 85, max_marks: 89 },
        { grade: "B", min_marks: 80, max_marks: 84 },
        { grade: "C+", min_marks: 75, max_marks: 79 },
        { grade: "C", min_marks: 70, max_marks: 74 },
        { grade: "D", min_marks: 60, max_marks: 69 },
        { grade: "F", min_marks: 0, max_marks: 59 }
    ];
}

function resolveGradeFromPercentage(percentage: number, thresholds?: any): string {
    const bands = Array.isArray(thresholds) && thresholds.length > 0 ? thresholds : defaultGradeBands();
    const band = bands.find((entry) => percentage >= Number(entry.min_marks) && percentage <= Number(entry.max_marks));
    return band?.grade ?? "F";
}

function normaliseExam(row: any) {
    const classIds = Array.from(
        new Set([
            ...(Array.isArray(row.class_ids) ? row.class_ids.map(toId) : []),
            toId(row.class_id)
        ].filter(Boolean))
    );

    return {
        _id: toId(row._id),
        id: toId(row._id),
        name: row.name || row.title || "",
        title: row.title || row.name || "",
        type: row.exam_type || row.type || "written",
        exam_type: row.exam_type || row.type || "written",
        subject: row.subject || "",
        total_marks: Number(row.max_marks ?? row.total_marks ?? 0),
        max_marks: Number(row.max_marks ?? row.total_marks ?? 0),
        pass_marks: Number(row.pass_marks ?? 0),
        exam_date: toDateString(row.exam_date ?? row.starts_at),
        starts_at: toDateString(row.starts_at ?? row.exam_date),
        status: row.status || "created",
        description: row.description || "",
        class_ids: classIds,
        marks: Array.isArray(row.marks) ? row.marks : [],
        schedule: Array.isArray(row.schedule) ? row.schedule : [],
        published_at: row.published_at ? toDateString(row.published_at) : "",
        results_published_at: row.results_published_at ? toDateString(row.results_published_at) : ""
    };
}

async function resolveAcademicYearId(ctx: RequestContext, academicYearId?: string) {
    if (academicYearId) return academicYearId;
    const active = (await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true })).select("_id").lean()) as any;
    return active?._id ? String(active._id) : undefined;
}

async function resolveTeacherClassIds(ctx: RequestContext): Promise<string[]> {
    if (ctx.role !== "teacher") return [];
    const teacher = (await TeacherModel.findOne(tenantFilter(ctx, { user_id: ctx.user_id })).select("class_ids").lean()) as any;
    return Array.isArray(teacher?.class_ids) ? teacher.class_ids.map(toId).filter(Boolean) : [];
}

async function loadExam(ctx: RequestContext, id: string) {
    const exam = await ExamModel.findOne(tenantFilter(ctx, { _id: id }))
        .populate("class_id", "name section academic_year grade_thresholds")
        .populate("class_ids", "name section academic_year grade_thresholds")
        .populate("academic_year_id", "year start_date end_date is_active")
        .populate("schedule.subject_id", "name code")
        .populate("schedule.class_id", "name section")
        .lean();

    if (!exam) {
        throw new ControlledError("NOT_FOUND", "Exam not found.", 404);
    }

    return exam as any;
}

async function ensureClassAccess(ctx: RequestContext, classIds: string[]) {
    if (ctx.role !== "teacher") return;
    const teacherClassIds = await resolveTeacherClassIds(ctx);
    const allowed = new Set(teacherClassIds);
    const unauthorized = classIds.filter((classId) => !allowed.has(classId));
    if (unauthorized.length > 0) {
        throw new ControlledError("FORBIDDEN", "You can only manage your own classes.", 403);
    }
}

function mapExamSummary(exam: any) {
    const classes = Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : [exam.class_id].filter(Boolean);
    return {
        id: exam._id,
        _id: exam._id,
        name: exam.name || exam.title,
        type: exam.exam_type || exam.type || "written",
        classes: classes.map((classRow: any) => classRow?.name || classRow?.class_name || String(classRow)),
        total_marks: Number(exam.max_marks ?? 0),
        pass_marks: Number(exam.pass_marks ?? 0),
        exam_date: toDateString(exam.exam_date ?? exam.starts_at),
        status: exam.status,
        description: exam.description || "",
        marks_entered: Array.isArray(exam.marks) ? exam.marks.length : 0
    };
}

function buildStudentName(student: any) {
    return `${student?.first_name || ""} ${student?.last_name || ""}`.trim();
}

async function getClassroomWithStudents(ctx: RequestContext, classId: string) {
    const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: classId }))
        .populate("subject_ids", "name code")
        .populate("academy_care_id", "year")
        .lean();

    if (!classroom) {
        throw new ControlledError("NOT_FOUND", "Class not found.", 404);
    }

    const students = await StudentModel.find(tenantFilter(ctx, { class_id: classId, status: "active" }))
        .sort({ last_name: 1, first_name: 1 })
        .lean();

    return { classroom: classroom as any, students };
}

export async function listExams(
    ctx: RequestContext,
    filter: { class_id?: string; academic_year_id?: string; status?: string } = {}
): Promise<ServiceResult<unknown[]>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");

        const teacherClassIds = await resolveTeacherClassIds(ctx);
        const query: Record<string, unknown> = {};
        if (filter.class_id) query.class_ids = filter.class_id;
        else if (ctx.role === "teacher" && teacherClassIds.length > 0) query.class_ids = { $in: teacherClassIds };
        if (filter.academic_year_id) query.academic_year_id = filter.academic_year_id;
        if (filter.status) query.status = filter.status;

        const rows = await ExamModel.find(tenantFilter(ctx, query))
            .populate("class_id", "name section")
            .populate("class_ids", "name section")
            .sort({ exam_date: -1, starts_at: -1 })
            .lean();

        return rows.map(mapExamSummary);
    });
}

export async function getExam(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");
        return mapExamDetail(await loadExam(ctx, id));
    });
}

function mapExamDetail(exam: any) {
    const grouped = new Map<string, any[]>();
    const scheduleRows = Array.isArray(exam.schedule) ? exam.schedule : [];
    for (const row of scheduleRows) {
        const classId = toId(row.class_id);
        if (!grouped.has(classId)) grouped.set(classId, []);
        grouped.get(classId)!.push(row);
    }

    const classThresholds = Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : [exam.class_id].filter(Boolean);

    return {
        id: exam._id,
        _id: exam._id,
        name: exam.name || exam.title,
        type: exam.exam_type || exam.type || "written",
        total_marks: Number(exam.max_marks ?? 0),
        pass_marks: Number(exam.pass_marks ?? 0),
        status: exam.status,
        description: exam.description || "",
        exam_date: toDateString(exam.exam_date ?? exam.starts_at),
        classes: classThresholds.map((classRow: any) => ({
            id: toId(classRow),
            name: classRow?.name || "",
            subjects: (grouped.get(toId(classRow)) ?? []).map((row) => ({
                id: toId(row.subject_id),
                name: row.subject_id?.name || row.subject_name || "",
                date: toDateString(row.date),
                start_time: row.start_time || "",
                end_time: row.end_time || "",
                hall: row.hall || "",
                marks_entered: Array.isArray(exam.marks) ? exam.marks.filter((mark: any) => String(mark.subject_id) === toId(row.subject_id)).length : 0,
                total_students: 0
            }))
        }))
    };
}

export async function createExam(ctx: RequestContext, input: any): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "create");

        const classIds = Array.from(
            new Set((input.class_ids || [input.class_id]).filter(Boolean).map((value: any) => String(value)))
        ) as string[];
        if (classIds.length === 0) {
            throw new ControlledError("VALIDATION_ERROR", "class_ids are required.", 400);
        }

        await ensureClassAccess(ctx, classIds);

        const [academicYearId, classes] = await Promise.all([
            resolveAcademicYearId(ctx, input.academic_year_id),
            ClassModel.find(tenantFilter(ctx, { _id: { $in: classIds } })).select("name section").lean()
        ]);

        if (classes.length !== classIds.length) {
            throw new ControlledError("NOT_FOUND", "One or more classes were not found.", 404);
        }

        const exam = await ExamModel.create({
            school_id: ctx.school_id,
            name: input.name || input.title || "",
            exam_type: input.type || input.exam_type || "written",
            class_id: new Types.ObjectId(String(classIds[0])),
            class_ids: classIds.map((classId) => new Types.ObjectId(String(classId))),
            academic_year_id: academicYearId ? new Types.ObjectId(academicYearId) : undefined,
            subject: input.subject || "",
            title: input.name || input.title || "",
            starts_at: input.exam_date ? new Date(input.exam_date) : input.starts_at ? new Date(input.starts_at) : undefined,
            exam_date: input.exam_date ? new Date(input.exam_date) : input.starts_at ? new Date(input.starts_at) : undefined,
            max_marks: Number(input.total_marks ?? input.max_marks ?? 0),
            pass_marks: Number(input.pass_marks ?? 0),
            description: input.description || "",
            status: input.status || "created"
        });

        return {
            id: String(exam._id),
            name: exam.name || exam.title,
            type: exam.exam_type,
            classes: classes.map((classItem) => classItem.name + (classItem.section ? `-${classItem.section}` : "")),
            total_marks: Number(exam.max_marks),
            pass_marks: Number(exam.pass_marks),
            status: exam.status
        };
    });
}

export async function updateExamSchedule(ctx: RequestContext, id: string, schedule: ExamScheduleRow[]): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "update");

        const exam = await loadExam(ctx, id);
        const classIds = Array.from(new Set(schedule.map((row) => String(row.class_id))));
        await ensureClassAccess(ctx, classIds);

        const updated = await ExamModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: id }),
            {
                $set: {
                    schedule: schedule.map((row) => ({
                        class_id: new Types.ObjectId(row.class_id),
                        subject_id: new Types.ObjectId(row.subject_id),
                        date: new Date(row.date),
                        start_time: row.start_time,
                        end_time: row.end_time,
                        hall: row.hall || ""
                    })),
                    status: "scheduled"
                }
            },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            throw new ControlledError("NOT_FOUND", "Exam not found.", 404);
        }

        return { id: String((updated as any)._id), status: (updated as any).status, schedule_count: schedule.length, exam_name: exam.name || exam.title };
    });
}

export async function publishExamSchedule(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "update");
        const updated = await ExamModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: id }),
            { $set: { status: "published", published_at: new Date() } },
            { new: true }
        ).lean();
        if (!updated) throw new ControlledError("NOT_FOUND", "Exam not found.", 404);
        return { id: String((updated as any)._id), status: (updated as any).status, message: "Schedule published successfully" };
    });
}

export async function unpublishExamResults(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "update");
        const updated = await ExamModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: id }),
            { $set: { status: "published" }, $unset: { results_published_at: 1 } },
            { new: true }
        ).lean();
        if (!updated) throw new ControlledError("NOT_FOUND", "Exam not found.", 404);
        await ResultModel.deleteMany(tenantFilter(ctx, { exam_id: new Types.ObjectId(id) }));
        return { exam_id: String((updated as any)._id), status: "unpublished", message: "Results unpublished" };
    });
}

export async function publishExamResults(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "create");

        const exam = await loadExam(ctx, id);
        const classIds = (Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : [exam.class_id]).map(toId) as string[];
        const scheduleRows = Array.isArray(exam.schedule) ? exam.schedule : [];
        if (scheduleRows.length === 0) {
            throw new ControlledError("NO_SCHEDULE", "No schedule set for this exam.", 400);
        }

        const marks = Array.isArray(exam.marks) ? exam.marks : [];
        const perStudent = new Map<string, any[]>();
        for (const mark of marks) {
            const key = String(mark.student_id);
            if (!perStudent.has(key)) perStudent.set(key, []);
            perStudent.get(key)!.push(mark);
        }

        const allStudents = await StudentModel.find(tenantFilter(ctx, { class_id: { $in: classIds }, status: "active" }))
            .select("_id class_id first_name last_name admission_no")
            .lean();

        const neededPerClass = new Map<string, number>();
        for (const classId of classIds) {
            neededPerClass.set(classId, scheduleRows.filter((row: any) => String(row.class_id) === classId).length);
        }

        const missing: string[] = [];
        for (const student of allStudents) {
            const studentMarks = perStudent.get(String(student._id)) ?? [];
            const expected = neededPerClass.get(String(student.class_id)) ?? 0;
            if (studentMarks.filter((mark) => String(mark.student_id) === String(student._id)).length < expected) {
                missing.push(String(student._id));
            }
        }

        if (missing.length > 0) {
            throw new ControlledError("MISSING_MARKS", "All marks are required before publishing results.", 400, { missing });
        }

        const classThresholdsById = new Map<string, any>();
        const classes = await ClassModel.find(tenantFilter(ctx, { _id: { $in: classIds } })).lean();
        for (const classroom of classes) {
            classThresholdsById.set(String(classroom._id), classroom.grade_thresholds);
        }

        const resultOps: any[] = [];
        const createdResults: any[] = [];

        for (const student of allStudents) {
            const studentMarks = perStudent.get(String(student._id)) ?? [];
            const totalObtained = studentMarks.reduce((sum, mark) => sum + Number(mark.marks_obtained ?? 0), 0);
            const totalPossible = scheduleRows.filter((row: any) => String(row.class_id) === String(student.class_id)).length * Number(exam.max_marks ?? 0);
            const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
            const grade = resolveGradeFromPercentage(percentage, classThresholdsById.get(String(student.class_id)));

            const resultPatch = {
                school_id: ctx.school_id,
                exam_id: new Types.ObjectId(id),
                class_id: new Types.ObjectId(String(student.class_id)),
                student_id: new Types.ObjectId(String(student._id)),
                obtained_marks: totalObtained,
                grade,
                remarks: percentage >= 75 ? "Excellent performance" : percentage >= 60 ? "Good effort" : "Needs improvement",
                graded_at: new Date()
            };

            resultOps.push({
                updateOne: {
                    filter: { school_id: ctx.school_id, exam_id: new Types.ObjectId(id), student_id: new Types.ObjectId(String(student._id)) },
                    update: { $set: resultPatch },
                    upsert: true
                }
            });
            createdResults.push({ ...resultPatch, student_name: buildStudentName(student), total_possible: totalPossible, percentage });
        }

        await ResultModel.bulkWrite(resultOps, { ordered: false });
        const updated = await ExamModel.findOneAndUpdate(
            tenantFilter(ctx, { _id: id }),
            { $set: { status: "results_published", results_published_at: new Date() } },
            { new: true }
        ).lean();

        return {
            exam_id: String(updated?._id ?? id),
            status: "results_published",
            total_results: createdResults.length,
            published_at: new Date().toISOString(),
            message: "Results published successfully"
        };
    });
}

export async function getExamCalendar(ctx: RequestContext, filter: { exam_id?: string; class_id?: string; academic_year_id?: string } = {}) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");
        const query: Record<string, unknown> = {};
        if (filter.exam_id) query._id = filter.exam_id;
        if (filter.class_id) query.class_ids = filter.class_id;
        if (filter.academic_year_id) query.academic_year_id = filter.academic_year_id;
        const exams = await ExamModel.find(tenantFilter(ctx, query))
            .populate("class_ids", "name section")
            .populate("schedule.subject_id", "name")
            .populate("schedule.class_id", "name section")
            .lean();

        return exams.flatMap((exam: any) => {
            const calendarMap = new Map<string, any[]>();
            for (const row of exam.schedule || []) {
                const date = toDateString(row.date);
                if (!calendarMap.has(date)) calendarMap.set(date, []);
                calendarMap.get(date)!.push({
                    time: `${row.start_time || ""}-${row.end_time || ""}`,
                    subject: row.subject_id?.name || "",
                    class: row.class_id?.name || "",
                    hall: row.hall || ""
                });
            }
            return {
                exam_id: String(exam._id),
                exam_name: exam.name || exam.title,
                calendar: Array.from(calendarMap.entries()).map(([date, schedule]) => ({ date, schedule }))
            };
        });
    });
}

export async function getExamScheduleByClass(ctx: RequestContext, classId: string) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");
        const exam = await ExamModel.findOne(tenantFilter(ctx, { class_ids: classId }))
            .populate("class_ids", "name section")
            .populate("schedule.subject_id", "name")
            .populate("schedule.class_id", "name section")
            .lean();

        if (!exam) {
            throw new ControlledError("NOT_FOUND", "Exam not found.", 404);
        }

        const classroom = ((exam.class_ids || []) as any[]).find((entry: any) => String(entry._id) === String(classId)) || exam.class_id;
        return {
            class: classroom?.name || "",
            exam: exam.name || exam.title,
            schedule: (exam.schedule || [])
                .filter((row: any) => String(row.class_id?._id ?? row.class_id) === String(classId))
                .map((row: any) => ({
                    subject: row.subject_id?.name || "",
                    date: toDateString(row.date),
                    time: `${row.start_time || ""}-${row.end_time || ""}`,
                    total_marks: Number(exam.max_marks ?? 0),
                    pass_marks: Number(exam.pass_marks ?? 0)
                }))
        };
    });
}

export async function getMarksGrid(ctx: RequestContext, id: string, filter: { class_id?: string; subject_id?: string } = {}) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");
        const exam = await loadExam(ctx, id);
        const classId = filter.class_id || toId(exam.class_id);
        const { classroom, students } = await getClassroomWithStudents(ctx, classId);

        const subjectIds = Array.isArray(classroom.subject_ids) ? classroom.subject_ids.map(toId) : [];
        const selectedSubjectIds = filter.subject_id ? subjectIds.filter((subjectId: string) => subjectId === filter.subject_id) : subjectIds;
        const subjects = await SubjectModel.find(tenantFilter(ctx, { _id: { $in: selectedSubjectIds } })).select("name code").lean();

        const marksByStudent = new Map<string, Record<string, number>>();
        for (const mark of exam.marks || []) {
            const studentId = String(mark.student_id);
            if (!marksByStudent.has(studentId)) marksByStudent.set(studentId, {});
            marksByStudent.get(studentId)![String(mark.subject_id)] = Number(mark.marks_obtained ?? 0);
        }

        return {
            exam_id: String(exam._id),
            exam_name: exam.name || exam.title,
            class: classroom.name,
            total_students: students.length,
            subjects: subjects.map((subject: any) => ({
                id: String(subject._id),
                name: subject.name,
                total_marks: Number(exam.max_marks ?? 0),
                marks_entered: (exam.marks || []).filter((mark: any) => String(mark.subject_id) === String(subject._id)).length
            })),
            students: students.map((student) => ({
                id: String(student._id),
                name: buildStudentName(student),
                roll_no: student.admission_no,
                enrollment_id: String(student._id)
            })),
            grid: Object.fromEntries(
                students.map((student) => [String(student._id), marksByStudent.get(String(student._id)) || {}])
            )
        };
    });
}

export async function saveMarksGrid(ctx: RequestContext, id: string, grid: MarksGridInput) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "create");
        const exam = await loadExam(ctx, id);

        const marks = Array.isArray(exam.marks) ? [...exam.marks] : [];
        const classIds = Array.from(new Set((Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : [exam.class_id]).map(toId))) as string[];
        const students = await StudentModel.find(tenantFilter(ctx, { class_id: { $in: classIds }, status: "active" }))
            .select("_id class_id")
            .lean();
        const validStudentIds = new Set(students.map((student) => String(student._id)));
        const validSubjects = await SubjectModel.find(tenantFilter(ctx, { status: "active" })).select("_id").lean();
        const validSubjectIds = new Set(validSubjects.map((subject) => String(subject._id)));

        let saved = 0;
        let failed = 0;

        for (const [studentId, subjectMap] of Object.entries(grid || {})) {
            if (!validStudentIds.has(studentId)) {
                failed += Object.keys(subjectMap || {}).length;
                continue;
            }
            for (const [subjectId, marksObtained] of Object.entries(subjectMap || {})) {
                if (!validSubjectIds.has(subjectId)) {
                    failed += 1;
                    continue;
                }
                if (Number(marksObtained) < 0 || Number(marksObtained) > Number(exam.max_marks ?? 0)) {
                    failed += 1;
                    continue;
                }
                const existingIndex = marks.findIndex((entry) => String(entry.student_id) === studentId && String(entry.subject_id) === subjectId);
                const record = {
                    student_id: new Types.ObjectId(studentId),
                    subject_id: new Types.ObjectId(subjectId),
                    marks_obtained: Number(marksObtained),
                    graded_by: new Types.ObjectId(ctx.user_id),
                    graded_at: new Date()
                };
                if (existingIndex >= 0) marks[existingIndex] = record as any;
                else marks.push(record as any);
                saved += 1;
            }
        }

        await ExamModel.findOneAndUpdate(tenantFilter(ctx, { _id: id }), { $set: { marks, status: exam.status === "created" ? "scheduled" : exam.status } }, { new: true });

        return { saved, failed, message: "Marks saved successfully" };
    });
}

export async function saveMarks(ctx: RequestContext, id: string, marks: Array<{ student_id: string; subject_id: string; marks_obtained: number }>) {
    const grid: MarksGridInput = {};
    for (const entry of marks || []) {
        if (!grid[entry.student_id]) grid[entry.student_id] = {};
        grid[entry.student_id][entry.subject_id] = Number(entry.marks_obtained);
    }
    return saveMarksGrid(ctx, id, grid);
}

export async function getExamMarks(ctx: RequestContext, id: string, filter: { class_id?: string; subject_id?: string } = {}) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const exam = await loadExam(ctx, id);
        const students = await StudentModel.find(tenantFilter(ctx, filter.class_id ? { class_id: filter.class_id } : {})).lean();
        const studentMap = new Map(students.map((student) => [String(student._id), student]));
        const subjects = await SubjectModel.find(tenantFilter(ctx, filter.subject_id ? { _id: filter.subject_id } : {})).lean();
        const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));

        return {
            exam: exam.title || exam.name,
            marks_data: (exam.marks || [])
                .filter((mark: any) => !filter.subject_id || String(mark.subject_id) === filter.subject_id)
                .map((mark: any) => ({
                    student: buildStudentName(studentMap.get(String(mark.student_id))),
                    class: String(studentMap.get(String(mark.student_id))?.class_id || ""),
                    subject: subjectMap.get(String(mark.subject_id))?.name || "",
                    marks: Number(mark.marks_obtained ?? 0),
                    total_marks: Number(exam.max_marks ?? 0)
                }))
        };
    });
}

export async function getMarksStatus(ctx: RequestContext, id: string) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "exams", "view");
        const exam = await loadExam(ctx, id);
        const classIds = Array.from(new Set((Array.isArray(exam.class_ids) && exam.class_ids.length > 0 ? exam.class_ids : [exam.class_id]).map(toId)));
        const { classroom, students } = await getClassroomWithStudents(ctx, String(classIds[0]));
        const subjects = await SubjectModel.find(tenantFilter(ctx, { _id: { $in: classroom.subject_ids || [] } })).lean();

        return {
            exam: exam.title || exam.name,
            completion_status: subjects.map((subject: any) => {
                const entered = (exam.marks || []).filter((mark: any) => String(mark.subject_id) === String(subject._id));
                return {
                    class: classroom.name,
                    subject: subject.name,
                    total_students: students.length,
                    marks_entered: entered.length,
                    percentage: students.length > 0 ? Math.round((entered.length / students.length) * 100) : 0,
                    status: entered.length >= students.length ? "complete" : "incomplete",
                    pending_students: students
                        .filter((student) => !entered.some((mark: any) => String(mark.student_id) === String(student._id)))
                        .map((student) => buildStudentName(student))
                };
            })
        };
    });
}

export async function getStudentResultCard(ctx: RequestContext, id: string, studentId: string) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const exam = await loadExam(ctx, id);
        const student = await StudentModel.findOne(tenantFilter(ctx, { _id: studentId })).populate("class_id", "name grade_thresholds academic_year").lean();
        if (!student) throw new ControlledError("NOT_FOUND", "Student not found.", 404);

        const marks = (exam.marks || []).filter((mark: any) => String(mark.student_id) === String(studentId));
        const classId = String((student as any).class_id?._id ?? (student as any).class_id);
        const classroom = (student as any).class_id?._id ? (student as any).class_id : await ClassModel.findOne(tenantFilter(ctx, { _id: classId })).lean();
        const thresholds = classroom?.grade_thresholds;

        const subjects = await SubjectModel.find(tenantFilter(ctx, { _id: { $in: marks.map((mark: any) => mark.subject_id) } })).lean();
        const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));

        const subjectRows = marks.map((mark: any) => {
            const percentage = Number(exam.max_marks ?? 0) > 0 ? (Number(mark.marks_obtained ?? 0) / Number(exam.max_marks ?? 0)) * 100 : 0;
            return {
                subject: subjectMap.get(String(mark.subject_id))?.name || "",
                marks: Number(mark.marks_obtained ?? 0),
                total_marks: Number(exam.max_marks ?? 0),
                percentage: Number(percentage.toFixed(2)),
                grade: resolveGradeFromPercentage(percentage, thresholds)
            };
        });

        const totalMarks = (subjectRows as any[]).reduce((sum: number, row: any) => sum + row.marks, 0);
        const totalPossible = (subjectRows as any[]).reduce((sum: number, row: any) => sum + row.total_marks, 0);
        const overallPercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
        const overallGrade = resolveGradeFromPercentage(overallPercentage, thresholds);

        const allStudentResults = await ResultModel.find(tenantFilter(ctx, { exam_id: new Types.ObjectId(id), class_id: new Types.ObjectId(classId) })).lean();
        const ranks = allStudentResults
            .map((row: any) => ({
                student_id: String(row.student_id),
                percentage: totalPossible > 0 ? (Number(row.obtained_marks ?? 0) / totalPossible) * 100 : 0
            }))
            .sort((left, right) => right.percentage - left.percentage);
        const position = Math.max(1, ranks.findIndex((entry) => entry.student_id === String(studentId)) + 1);
        const classAverage = ranks.length > 0 ? Number((ranks.reduce((sum, row) => sum + row.percentage, 0) / ranks.length).toFixed(2)) : 0;

        return {
            exam_name: exam.title || exam.name,
            student_name: buildStudentName(student),
            roll_no: (student as any).admission_no,
            class: classroom?.name || "",
            result_date: toDateString(exam.results_published_at || new Date()),
            subjects: subjectRows,
            total_marks: totalMarks,
            total_possible: totalPossible,
            overall_percentage: Number(overallPercentage.toFixed(2)),
            overall_grade: overallGrade,
            position,
            class_average: classAverage,
            remarks: overallPercentage >= 75 ? "Excellent performance" : overallPercentage >= 60 ? "Good effort" : "Needs improvement"
        };
    });
}

export async function getExamResults(ctx: RequestContext, id: string, filter: { class_id?: string; sort_by?: string } = {}) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");
        const exam = await loadExam(ctx, id);
        const classId = filter.class_id || toId(exam.class_id);
        const results = await ResultModel.find(tenantFilter(ctx, { exam_id: new Types.ObjectId(id), class_id: new Types.ObjectId(classId) }))
            .populate("student_id", "first_name last_name admission_no class_id")
            .populate("class_id", "name")
            .lean();

        const rows = results.map((row: any) => {
            const totalPossible = Number(exam.max_marks ?? 0) * (exam.schedule || []).filter((scheduleRow: any) => String(scheduleRow.class_id) === String(classId)).length;
            const percentage = totalPossible > 0 ? (Number(row.obtained_marks ?? 0) / totalPossible) * 100 : 0;
            return {
                student_id: String(row.student_id?._id ?? row.student_id),
                student_name: buildStudentName(row.student_id),
                class: row.class_id?.name || "",
                roll_no: row.student_id?.admission_no || "",
                total_marks: Number(row.obtained_marks ?? 0),
                total_possible: totalPossible,
                percentage: Number(percentage.toFixed(2)),
                grade: row.grade || resolveGradeFromPercentage(percentage, (row.class_id as any)?.grade_thresholds),
                position: 0
            };
        });

        if (filter.sort_by === "marks") rows.sort((left, right) => right.percentage - left.percentage);
        else rows.sort((left, right) => left.student_name.localeCompare(right.student_name));

        rows.forEach((row, index) => {
            row.position = index + 1;
        });

        return {
            exam: exam.title || exam.name,
            total_results: rows.length,
            results: rows
        };
    });
}

export async function getStudentResults(ctx: RequestContext) {
    return serviceTry(async () => {
        await connectDb();
        assertPermission(ctx, "results", "view");

        let studentIds: string[] = [];
        if (ctx.role === "parent") {
            const parentLinks = await ParentModel.find(tenantFilter(ctx, { user_id: ctx.user_id, status: "active" })).lean();
            studentIds = parentLinks.map((row) => String(row.student_id));
        }

        const students = await StudentModel.find(tenantFilter(ctx, studentIds.length > 0 ? { _id: { $in: studentIds } } : { user_id: ctx.user_id }))
            .populate("class_id", "name academic_year grade_thresholds")
            .lean();
        if (students.length === 0) {
            throw new ControlledError("NOT_FOUND", "Student not found.", 404);
        }

        const allResults = await ResultModel.find(tenantFilter(ctx, { student_id: { $in: students.map((student) => student._id) } }))
            .populate("exam_id", "title name exam_date results_published_at max_marks schedule marks class_ids class_id")
            .populate("class_id", "name grade_thresholds")
            .lean();

        const grouped = new Map<string, any[]>();
        for (const result of allResults) {
            const studentId = String(result.student_id);
            if (!grouped.has(studentId)) grouped.set(studentId, []);
            grouped.get(studentId)!.push(result);
        }

        const summaries = await Promise.all(students.map(async (student: any) => {
            const studentResults = grouped.get(String(student._id)) || [];
            const summaryResults = studentResults.map((result: any) => {
                const exam = result.exam_id as any;
                const scheduleSubjectMap = new Map<string, string>();
                for (const scheduleRow of exam?.schedule || []) {
                    if (scheduleRow?.subject_id) {
                        scheduleSubjectMap.set(String(scheduleRow.subject_id._id ?? scheduleRow.subject_id), scheduleRow.subject_id?.name || "");
                    }
                }

                const studentMarks = (exam?.marks || []).filter((mark: any) => String(mark.student_id) === String(student._id));
                const subjectRows = studentMarks.map((mark: any) => {
                    const percentage = Number(exam?.max_marks ? ((Number(mark.marks_obtained ?? 0) / Number(exam.max_marks)) * 100).toFixed(2) : 0);
                    return {
                        subject: scheduleSubjectMap.get(String(mark.subject_id)) || "",
                        marks: Number(mark.marks_obtained ?? 0),
                        total_marks: Number(exam?.max_marks ?? 0),
                        percentage,
                        grade: resolveGradeFromPercentage(percentage, (student as any).class_id?.grade_thresholds)
                    };
                });

                const totalObtained = Number(result.obtained_marks ?? 0);
                const totalPossible = subjectRows.reduce((sum: number, row: any) => sum + row.total_marks, 0);
                const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;

                return {
                    exam_id: String(exam?._id ?? result.exam_id),
                    exam_name: exam?.title || exam?.name || "",
                    exam_date: toDateString(exam?.exam_date ?? exam?.starts_at),
                    published_date: toDateString(exam?.results_published_at ?? result.graded_at),
                    subjects: subjectRows,
                    total_obtained: totalObtained,
                    total_marks: totalPossible,
                    percentage: Number(percentage.toFixed(2)),
                    grade: result.grade || resolveGradeFromPercentage(percentage, (student as any).class_id?.grade_thresholds),
                    rank: Math.max(1, studentResults.findIndex((entry: any) => String(entry._id) === String(result._id)) + 1),
                    total_students: studentResults.length
                };
            });

            return {
                student: buildStudentName(student),
                class: (student as any).class_id?.name || "",
                academic_year: (student as any).class_id?.academic_year || "",
                results: summaryResults
            };
        }));

        const primaryStudent = summaries[0];
        return {
            students: summaries,
            student: primaryStudent?.student || "",
            class: primaryStudent?.class || "",
            academic_year: primaryStudent?.academic_year || "",
            results: primaryStudent?.results || []
        };
    });
}
