import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel } from "@edu/shared/models/class.model";
import { sessionRequest } from "../../../../_utils";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const body = await request.json();
        const grades = Array.isArray(body?.grades) ? body.grades : [];

        if (grades.length === 0) {
            return NextResponse.json(
                fail("VALIDATION_ERROR", "grades are required", 400),
                { status: 400 }
            );
        }

        const normalized = grades.map((grade: any) => ({
            grade: String(grade?.grade ?? "").trim().toUpperCase(),
            min_marks: Number(grade?.min_marks),
            max_marks: Number(grade?.max_marks)
        }));

        for (const grade of normalized) {
            if (!grade.grade || Number.isNaN(grade.min_marks) || Number.isNaN(grade.max_marks)) {
                return NextResponse.json(fail("VALIDATION_ERROR", "Each grade needs grade, min_marks, and max_marks", 400), { status: 400 });
            }

            if (grade.min_marks >= grade.max_marks) {
                return NextResponse.json(fail("VALIDATION_ERROR", "min_marks must be lower than max_marks", 400), { status: 400 });
            }
        }

        const sorted = [...normalized].sort((left, right) => left.min_marks - right.min_marks);
        for (let index = 1; index < sorted.length; index += 1) {
            if (sorted[index].min_marks <= sorted[index - 1].max_marks) {
                return NextResponse.json(fail("VALIDATION_ERROR", "Grade ranges cannot overlap", 400), { status: 400 });
            }
        }

        const failingGrade = sorted.find((grade) => grade.grade === "F");
        if (failingGrade && failingGrade.min_marks !== sorted[0].min_marks) {
            return NextResponse.json(fail("VALIDATION_ERROR", "F must be the lowest grade band", 400), { status: 400 });
        }

        const updated: any = await ClassModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            { $set: { grade_thresholds: normalized } },
            { new: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(fail("NOT_FOUND", "Class not found", 404), { status: 404 });
        }

        return NextResponse.json(
            { class_id: String(updated._id), grades_set: normalized.length, status: "success" },
            { status: 200 }
        );
    } catch (error) {
        console.error("[POST /api/school/classes/[id]/grades] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
