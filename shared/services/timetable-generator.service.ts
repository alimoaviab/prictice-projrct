// @ts-nocheck
import { Types } from "mongoose";
import { ClassModel, TimetableModel, TeacherModel, SubjectModel } from "../models";
import { tenantFilter } from "../db/tenant-query";
import { connectDb } from "../db/connect";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { toClientRecord } from "./timetable.service";

const DAY_TO_NUMBER: Record<string, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
};

interface GeneratorConfig {
    school_id: string;
    daysPerWeek?: string[];
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
}

const DEFAULT_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DEFAULT_START = "08:00";
const DEFAULT_END = "16:00";
const DEFAULT_SLOT = 45;

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateTimeSlots(start: string, end: string, duration: number): Array<{ start: string; end: string }> {
    const slots: Array<{ start: string; end: string }> = [];
    let current = timeToMinutes(start);
    const endMin = timeToMinutes(end);

    while (current + duration <= endMin) {
        slots.push({
            start: minutesToTime(current),
            end: minutesToTime(current + duration)
        });
        current += duration;
    }

    return slots;
}

export async function generateTimetable(
    ctx: RequestContext,
    config: Partial<GeneratorConfig>
): Promise<ServiceResult<any>> {
    try {
        await connectDb();

        const school_id = ctx.school_id;
        const days = config.daysPerWeek || DEFAULT_DAYS;
        const startTime = config.startTime || DEFAULT_START;
        const endTime = config.endTime || DEFAULT_END;
        const slotDuration = config.slotDuration || DEFAULT_SLOT;

        const timeSlots = generateTimeSlots(startTime, endTime, slotDuration);

        const classes = await ClassModel.find(tenantFilter(ctx)).lean();
        if (!classes.length) {
            throw new ControlledError("NO_DATA", "No classes found", 400);
        }

        const subjects = await SubjectModel.find(tenantFilter(ctx, { status: "active" })).lean();
        if (!subjects.length) {
            throw new ControlledError("NO_DATA", "No active subjects found", 400);
        }

        const teachers = await TeacherModel.find(tenantFilter(ctx, { status: "active" })).lean();
        if (!teachers.length) {
            throw new ControlledError("NO_DATA", "No active teachers found", 400);
        }

        await TimetableModel.deleteMany(tenantFilter(ctx));

        const generatedEntries: any[] = [];
        const subjectUsagePerClass: Record<string, Set<string>> = {};
        const teacherSchedule: Record<string, Set<string>> = {};

        for (const classDoc of classes) {
            const classId = String(classDoc._id);
            subjectUsagePerClass[classId] = new Set();

            for (const day of days) {
                for (const slot of timeSlots) {
                    const slotKey = `${day}:${slot.start}:${slot.end}`;

                    let assignedSubject = null;
                    let assignedTeacher = null;

                    for (const subject of subjects) {
                        const subjectId = String(subject._id);

                        if (subjectUsagePerClass[classId].has(subjectId)) {
                            continue;
                        }

                        const compatibleTeachers = teachers.filter((t) => {
                            const teacherId = String(t._id);
                            const teacherSlotKey = `${teacherId}:${slotKey}`;

                            return !teacherSchedule[teacherSlotKey];
                        });

                        if (compatibleTeachers.length > 0) {
                            assignedTeacher = compatibleTeachers[0];
                            assignedSubject = subject;
                            break;
                        }
                    }

                    if (assignedSubject && assignedTeacher) {
                        const classId = String(classDoc._id);
                        const subjectId = String(assignedSubject._id);
                        const teacherId = String(assignedTeacher._id);
                        const teacherSlotKey = `${teacherId}:${slotKey}`;

                        const entry = new TimetableModel({
                            school_id,
                            class_id: new Types.ObjectId(classId),
                            teacher_id: new Types.ObjectId(teacherId),
                            subject_id: new Types.ObjectId(subjectId),
                            subject: assignedSubject.name,
                            day_of_week: DAY_TO_NUMBER[day],
                            day,
                            period_number: timeSlots.indexOf(slot) + 1,
                            start_time: slot.start,
                            end_time: slot.end,
                            room: ""
                        });

                        await entry.save();
                        generatedEntries.push(entry.toObject());

                        subjectUsagePerClass[classId].add(subjectId);
                        teacherSchedule[teacherSlotKey] = true;
                    }
                }
            }
        }

        // Populate and transform entries for client response
        const populatedEntries = await TimetableModel.find(
            tenantFilter(ctx, { _id: { $in: generatedEntries.map(e => e._id) } })
        )
            .populate("class_id", "name")
            .populate("teacher_id", "first_name last_name")
            .lean();

        return {
            ok: true,
            success: true,
            data: {
                generated: generatedEntries.length,
                total: classes.length * days.length * timeSlots.length,
                entries: populatedEntries.map(toClientRecord)
            },
            message: `Generated ${generatedEntries.length} timetable entries`
        };
    } catch (error: any) {
        if (error instanceof ControlledError) {
            return {
                ok: false,
                success: false,
                error: { code: error.code, message: error.message, status: error.status },
                message: error.message
            };
        }

        return {
            ok: false,
            success: false,
            error: { code: "GENERATION_FAILED", message: "Failed to generate timetable", status: 500 },
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

export async function validateTimetableConflicts(ctx: RequestContext): Promise<ServiceResult<any>> {
    try {
        await connectDb();

        const entries = await TimetableModel.find(tenantFilter(ctx))
            .populate("class_id", "name")
            .populate("teacher_id", "first_name last_name")
            .lean();

        const conflicts: any[] = [];

        const classSubjects: Record<string, Record<string, string[]>> = {};
        const teacherSchedule: Record<string, Array<{ start: string; end: string; classId: string }>> = {};

        for (const entry of entries) {
            const classKey = String(entry.class_id._id);
            const dayKey = entry.day;
            const classSubjectKey = `${classKey}:${dayKey}`;

            if (!classSubjects[classSubjectKey]) {
                classSubjects[classSubjectKey] = {};
            }

            if (classSubjects[classSubjectKey][entry.subject]) {
                conflicts.push({
                    type: "SUBJECT_DUPLICATE",
                    message: `Subject "${entry.subject}" appears twice for ${(entry.class_id as any).name} on ${dayKey}`,
                    entry: entry._id
                });
            } else {
                classSubjects[classSubjectKey][entry.subject] = [String(entry._id)];
            }

            const teacherId = String(entry.teacher_id._id);
            if (!teacherSchedule[teacherId]) {
                teacherSchedule[teacherId] = [];
            }

            const hasTeacherConflict = teacherSchedule[teacherId].some(
                (scheduled) =>
                    scheduled.start < entry.end_time &&
                    entry.start_time < scheduled.end &&
                    scheduled.classId !== classKey
            );

            if (hasTeacherConflict) {
                conflicts.push({
                    type: "TEACHER_CONFLICT",
                    message: `Teacher "${(entry.teacher_id as any).first_name}" has overlapping schedule`,
                    entry: entry._id
                });
            } else {
                teacherSchedule[teacherId].push({
                    start: entry.start_time,
                    end: entry.end_time,
                    classId: classKey
                });
            }
        }

        return {
            ok: true,
            success: true,
            data: {
                total: entries.length,
                conflicts: conflicts.length,
                details: conflicts
            },
            message: conflicts.length > 0 ? `Found ${conflicts.length} conflicts` : "No conflicts detected"
        };
    } catch (error: any) {
        return {
            ok: false,
            success: false,
            error: { code: "VALIDATION_FAILED", message: "Failed to validate timetable", status: 500 },
            message: error instanceof Error ? error.message : "Unknown error"
        };
    }
}
