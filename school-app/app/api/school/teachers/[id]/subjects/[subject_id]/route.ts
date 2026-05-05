import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { TeacherModel } from "@edu/shared/models/teacher.model";
import { sessionRequest } from "../../../../../_utils";
import { Types } from "mongoose";

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string; subject_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id, subject_id } = await props.params;

        const updated = await TeacherModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            { $pull: { subject_ids: new Types.ObjectId(subject_id) } },
            { new: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(fail("NOT_FOUND", "Teacher not found", 404), { status: 404 });
        }

        return NextResponse.json({ message: "Subject removed from teacher" }, { status: 200 });
    } catch (error) {
        console.error("[DELETE /api/school/teachers/[id]/subjects/[subject_id]] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
