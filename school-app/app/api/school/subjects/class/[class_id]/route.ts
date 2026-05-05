import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel } from "@edu/shared/models/class.model";
import { sessionRequest } from "../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ class_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { class_id } = await props.params;

        const classroom: any = await ClassModel.findOne({ school_id: ctx.school_id, _id: class_id })
            .populate({ path: "subject_ids", select: "_id name code description status" })
            .lean();

        if (!classroom) {
            return NextResponse.json(fail("NOT_FOUND", "Class not found", 404), { status: 404 });
        }

        return NextResponse.json(
            {
                class: classroom.name,
                subjects: (classroom.subject_ids ?? []).map((subject: any) => ({
                    id: String(subject._id),
                    name: subject.name,
                    code: subject.code ?? "",
                    teacher: "",
                    total_marks: 100
                }))
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/subjects/class/[class_id]] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
