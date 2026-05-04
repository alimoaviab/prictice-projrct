import { NextRequest, NextResponse } from "next/server";
import { sessionRequest } from "../../_utils";
import { authenticateRequest } from "@/shared/auth/middleware";
import { assertPermission } from "@/shared/auth/rbac";
import { connectDb } from "@/shared/db/connect";
import { TeacherModel } from "@/shared/models/teacher.model";
import { SubjectModel } from "@/shared/models/subject.model";
import { Types } from "mongoose";

/**
 * GET /api/teachers/[id]/subjects
 * Get all subjects a teacher teaches
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "teachers", "view");

        await connectDb();

        const teacher = await TeacherModel.findById(params.id)
            .populate({
                path: "subject_ids",
                select: "_id name code description status",
                match: { school_id: session.schoolId }
            })
            .lean();

        if (!teacher) {
            return NextResponse.json(
                { error: "Teacher not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            subjects: teacher.subject_ids || []
        });
    } catch (error: any) {
        console.error("[GET /api/teachers/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch subjects" },
            { status: error.status || 500 }
        );
    }
}

/**
 * POST /api/teachers/[id]/subjects
 * Add subjects a teacher teaches
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "teachers", "update");

        await connectDb();

        const body = await request.json();
        const { subject_ids } = body;

        if (!Array.isArray(subject_ids)) {
            return NextResponse.json(
                { error: "subject_ids must be an array" },
                { status: 400 }
            );
        }

        // Limit to 10 subjects per teacher (reasonable business constraint)
        if (subject_ids.length > 10) {
            return NextResponse.json(
                { error: "Teachers cannot teach more than 10 subjects" },
                { status: 400 }
            );
        }

        // Validate all subject IDs exist and are active
        const subjects = await SubjectModel.find({
            _id: { $in: subject_ids.map((id: string) => new Types.ObjectId(id)) },
            school_id: session.schoolId,
            status: "active"
        });

        if (subjects.length !== subject_ids.length) {
            return NextResponse.json(
                { error: "Some subjects not found or are inactive" },
                { status: 400 }
            );
        }

        // Update teacher with subject IDs
        const teacher = await TeacherModel.findByIdAndUpdate(
            params.id,
            { subject_ids },
            { new: true }
        )
            .populate({
                path: "subject_ids",
                select: "_id name code description status"
            })
            .lean();

        if (!teacher) {
            return NextResponse.json(
                { error: "Teacher not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Subjects added to teacher",
            subjects: teacher.subject_ids || []
        });
    } catch (error: any) {
        console.error("[POST /api/teachers/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to add subjects" },
            { status: error.status || 500 }
        );
    }
}

/**
 * DELETE /api/teachers/[id]/subjects/[subjectId]
 * Remove a subject from a teacher
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "teachers", "update");

        await connectDb();

        const url = new URL(request.url);
        const subjectId = url.pathname.split("/").pop();

        if (!subjectId) {
            return NextResponse.json(
                { error: "Subject ID is required" },
                { status: 400 }
            );
        }

        // Remove subject from teacher
        const teacher = await TeacherModel.findByIdAndUpdate(
            params.id,
            { $pull: { subject_ids: new Types.ObjectId(subjectId) } },
            { new: true }
        )
            .populate({
                path: "subject_ids",
                select: "_id name code description status"
            })
            .lean();

        if (!teacher) {
            return NextResponse.json(
                { error: "Teacher not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Subject removed from teacher",
            subjects: teacher.subject_ids || []
        });
    } catch (error: any) {
        console.error("[DELETE /api/teachers/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to remove subject" },
            { status: error.status || 500 }
        );
    }
}
