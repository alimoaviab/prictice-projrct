import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel } from "@edu/shared/models/class.model";
import { SubjectModel } from "@edu/shared/models/subject.model";
import { sessionRequest } from "../../../../_utils";
import { Types } from "mongoose";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;

        const classroom: any = await ClassModel.findOne({ school_id: ctx.school_id, _id: id })
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
                    description: subject.description ?? "",
                    status: subject.status ?? "active"
                }))
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/classes/[id]/subjects] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const body = await request.json();
        const subject_ids = Array.isArray(body?.subject_ids) ? body.subject_ids : [];

        if (subject_ids.length === 0) {
            return NextResponse.json(fail("VALIDATION_ERROR", "subject_ids are required", 400), { status: 400 });
        }

        const subjects = await SubjectModel.find({
            _id: { $in: subject_ids.map((subjectId: string) => new Types.ObjectId(subjectId)) },
            school_id: ctx.school_id,
            status: "active"
        }).lean();

        if (subjects.length !== subject_ids.length) {
            return NextResponse.json(fail("NOT_FOUND", "Some subjects not found or inactive", 404), { status: 404 });
        }

        const updated: any = await ClassModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            {
                $addToSet: { subject_ids: { $each: subject_ids.map((subjectId: string) => new Types.ObjectId(subjectId)) } },
                $set: { subjects: subjects.map((subject) => subject.name) }
            },
            { new: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(fail("NOT_FOUND", "Class not found", 404), { status: 404 });
        }

        return NextResponse.json(
            { message: "Subjects added to class", subjects: subjects.map((subject) => ({ id: String(subject._id), name: subject.name })) },
            { status: 200 }
        );
    } catch (error) {
        console.error("[POST /api/school/classes/[id]/subjects] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const subjectId = new URL(request.url).searchParams.get("subject_id");

        if (!subjectId) {
            return NextResponse.json(fail("VALIDATION_ERROR", "subject_id is required", 400), { status: 400 });
        }

        const updated = await ClassModel.findOneAndUpdate(
            { school_id: ctx.school_id, _id: id },
            { $pull: { subject_ids: new Types.ObjectId(subjectId) } },
            { new: true }
        ).lean();

        if (!updated) {
            return NextResponse.json(fail("NOT_FOUND", "Class not found", 404), { status: 404 });
        }

        return NextResponse.json({ message: "Subject removed from class" }, { status: 200 });
    } catch (error) {
        console.error("[DELETE /api/school/classes/[id]/subjects] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
