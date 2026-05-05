import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { assertPermission } from "@edu/shared/auth/rbac";
import { connectDb } from "@edu/shared/db/connect";
import { ClassModel } from "@edu/shared/models/class.model";
import { StudentModel } from "@edu/shared/models/student.model";
import { SubjectModel } from "@edu/shared/models/subject.model";
import { TeacherModel } from "@edu/shared/models/teacher.model";
import { fail } from "@edu/shared/utils/result";
import { updateTeacher, deleteTeacher } from "@edu/shared/services/teacher.service";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        assertPermission(ctx, "teachers", "view");
        await connectDb();

        const { id } = await params;
        const teacher: any = await TeacherModel.findOne({ school_id: ctx.school_id, _id: id })
            .populate({ path: "class_ids", select: "name section capacity academic_year" })
            .populate({ path: "subject_ids", select: "name code" })
            .lean();

        if (!teacher) {
            return NextResponse.json(fail("NOT_FOUND", "Teacher not found", 404), { status: 404 });
        }

        const classItems = Array.isArray(teacher.class_ids) ? teacher.class_ids : [];
        const subjectItems = Array.isArray(teacher.subject_ids) ? teacher.subject_ids : [];
        const classIds = classItems.map((classItem: any) => String(classItem._id ?? classItem));
        const subjectIds = subjectItems.map((subjectItem: any) => String(subjectItem._id ?? subjectItem));

        const studentCounts = classIds.length > 0
            ? await StudentModel.aggregate([
                { $match: { school_id: ctx.school_id, class_id: { $in: classIds } } },
                { $group: { _id: "$class_id", count: { $sum: 1 } } }
            ])
            : [];
        const countsByClass = new Map(studentCounts.map((entry) => [String(entry._id), Number(entry.count || 0)]));

        const classDetails = classIds.length > 0
            ? await ClassModel.find({ school_id: ctx.school_id, _id: { $in: classIds } })
                .select("name section capacity academic_year")
                .lean()
            : [];
        const subjectDetails = subjectIds.length > 0
            ? await SubjectModel.find({ school_id: ctx.school_id, _id: { $in: subjectIds } })
                .select("name code")
                .lean()
            : [];

        return NextResponse.json(
            {
                teacher: {
                    id: String(teacher._id),
                    employee_no: teacher.employee_no,
                    first_name: teacher.first_name,
                    last_name: teacher.last_name,
                    email: teacher.email ?? "",
                    phone: teacher.phone ?? "",
                    qualification: teacher.qualification ?? "",
                    status: teacher.status ?? "active"
                },
                classes: classDetails.map((classItem: any) => ({
                    id: String(classItem._id),
                    name: classItem.name,
                    section: classItem.section ?? "",
                    capacity: Number(classItem.capacity ?? 0),
                    academic_year: classItem.academic_year ?? "",
                    enrolled_students: countsByClass.get(String(classItem._id)) ?? 0
                })),
                subjects: subjectDetails.map((subject: any) => ({
                    id: String(subject._id),
                    name: subject.name,
                    code: subject.code ?? ""
                }))
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/teachers/[id]] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await params;
        const body = await request.json();
        const result = await updateTeacher(ctx, id, body);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await params;
        const result = await deleteTeacher(ctx, id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
