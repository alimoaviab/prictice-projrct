import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel, StudentModel } from "@edu/shared/models";
import { sessionRequest } from "../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;

        const classroom: any = await ClassModel.findOne({ school_id: ctx.school_id, _id: id }).lean();
        if (!classroom) {
            return NextResponse.json(fail("NOT_FOUND", "Class not found", 404), { status: 404 });
        }

        const students = await StudentModel.find({ school_id: ctx.school_id, class_id: id })
            .sort({ last_name: 1, first_name: 1 })
            .lean();

        return NextResponse.json(
            {
                class: classroom.name,
                total_students: students.length,
                students: students.map((student) => ({
                    id: String(student._id),
                    name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
                    roll_no: student.admission_no ?? "",
                    email: student.guardian?.email ?? "",
                    status: student.status ?? "active"
                }))
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/classes/[id]/students] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}