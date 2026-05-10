import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { TeacherModel, ClassModel, StudentModel } from "@edu/shared/models";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const teacher: any = await TeacherModel.findOne({ school_id: ctx.school_id, user_id: ctx.user_id }).lean();

        if (!teacher) {
            return NextResponse.json({ classes: [] }, { status: 200 });
        }

        const classes: any[] = await ClassModel.find({ school_id: ctx.school_id, _id: { $in: teacher.class_ids ?? [] } }).lean();
        const counts = await StudentModel.aggregate([
            { $match: { school_id: ctx.school_id, class_id: { $in: teacher.class_ids ?? [] }, status: "active" } },
            { $group: { _id: "$class_id", count: { $sum: 1 } } }
        ]);
        const countMap = new Map(counts.map((entry) => [String(entry._id), Number(entry.count || 0)]));

        return NextResponse.json(
            ok({
                classes: classes.map((classItem) => ({
                    id: String(classItem._id),
                    name: classItem.name,
                    section: classItem.section ?? "",
                    students: countMap.get(String(classItem._id)) ?? 0,
                    subjects: classItem.subjects ?? [],
                    academic_year: classItem.academic_year ?? ""
                }))
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/my-classes] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
