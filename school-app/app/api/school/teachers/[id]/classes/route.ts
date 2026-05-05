import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel, TeacherModel, StudentModel } from "@edu/shared/models";
import { sessionRequest } from "../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const teacher: any = await TeacherModel.findOne({ school_id: ctx.school_id, _id: id }).lean();

        if (!teacher) {
            return NextResponse.json(fail("NOT_FOUND", "Teacher not found", 404), { status: 404 });
        }

        const classes: any[] = await ClassModel.find({
            school_id: ctx.school_id,
            _id: { $in: (teacher.class_ids ?? []).map((classId: unknown) => new Types.ObjectId(String(classId))) }
        })
            .lean();

        const counts = await StudentModel.aggregate([
            { $match: { school_id: ctx.school_id, class_id: { $in: teacher.class_ids ?? [] }, status: "active" } },
            { $group: { _id: "$class_id", count: { $sum: 1 } } }
        ]);
        const countMap = new Map(counts.map((entry) => [String(entry._id), Number(entry.count || 0)]));

        return NextResponse.json(
            {
                teacher: `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim(),
                classes: classes.map((classItem) => ({
                    id: String(classItem._id),
                    name: classItem.name,
                    section: classItem.section ?? "",
                    capacity: Number(classItem.capacity ?? 0),
                    enrolled: countMap.get(String(classItem._id)) ?? 0,
                    role: String(classItem.class_teacher_id) === String(teacher._id) ? "class_teacher" : "subject_teacher"
                }))
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/teachers/[id]/classes] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const body = await request.json();
        const classId = body?.class_id;
        const role = body?.role || "subject_teacher";

        if (!classId) {
            return NextResponse.json(fail("VALIDATION_ERROR", "class_id is required", 400), { status: 400 });
        }

        const teacher: any = await TeacherModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            { $addToSet: { class_ids: new Types.ObjectId(classId) } },
            { new: true }
        ).lean();

        const classroom: any = await ClassModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: classId },
            role === "class_teacher"
                ? { $set: { class_teacher_id: new Types.ObjectId(id) }, $addToSet: { teacher_ids: new Types.ObjectId(id) } }
                : { $addToSet: { teacher_ids: new Types.ObjectId(id) } },
            { new: true }
        ).lean();

        if (!teacher || !classroom) {
            return NextResponse.json(fail("NOT_FOUND", "Teacher or class not found", 404), { status: 404 });
        }

        return NextResponse.json(
            {
                id,
                teacher: `${teacher?.first_name || ""} ${teacher?.last_name || ""}`.trim(),
                class: classroom.name,
                academic_year: classroom.academic_year || "",
                role
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[POST /api/school/teachers/[id]/classes] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const url = new URL(request.url);
        const classId = url.searchParams.get("class_id");

        if (!classId) {
            return NextResponse.json(fail("VALIDATION_ERROR", "class_id is required", 400), { status: 400 });
        }

        await TeacherModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            { $pull: { class_ids: new Types.ObjectId(classId) } },
            { new: true }
        );

        await ClassModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: classId },
            { $pull: { teacher_ids: new Types.ObjectId(id) } },
            { new: true }
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[DELETE /api/school/teachers/[id]/classes] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
