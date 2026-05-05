import { NextRequest, NextResponse } from "next/server";
import { sessionRequest } from "../../../_utils";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { assertPermission } from "@edu/shared/auth/rbac";
import { connectDb } from "@edu/shared/db/connect";
import { ClassModel } from "@edu/shared/models/class.model";
import { SubjectModel } from "@edu/shared/models/subject.model";
import { Types } from "mongoose";

/**
 * GET /api/classes/[id]/subjects
 * Get all subjects for a specific class
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "classes", "view");

        await connectDb();
        const { id } = await params;

        const classData = (await ClassModel.findById(id)
            .populate({
                path: "subject_ids",
                select: "_id name code description status",
                match: { school_id: session.school_id }
            })
            .lean()) as { subject_ids?: unknown[] } | null;

        if (!classData) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            subjects: classData.subject_ids || []
        });
    } catch (error: any) {
        console.error("[GET /api/classes/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch subjects" },
            { status: error.status || 500 }
        );
    }
}

/**
 * POST /api/classes/[id]/subjects
 * Add subjects to a class
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "classes", "update");

        await connectDb();
        const { id } = await params;

        const body = await request.json();
        const { subject_ids } = body;

        if (!Array.isArray(subject_ids)) {
            return NextResponse.json(
                { error: "subject_ids must be an array" },
                { status: 400 }
            );
        }

        // Validate all subject IDs exist and are active
        const subjects = await SubjectModel.find({
            _id: { $in: subject_ids.map((id: string) => new Types.ObjectId(id)) },
            school_id: session.school_id,
            status: "active"
        });

        if (subjects.length !== subject_ids.length) {
            return NextResponse.json(
                { error: "Some subjects not found or are inactive" },
                { status: 400 }
            );
        }

        // Update class with subject IDs
        const classData = (await ClassModel.findByIdAndUpdate(
            id,
            { subject_ids },
            { new: true }
        )
            .populate({
                path: "subject_ids",
                select: "_id name code description status"
            })
            .lean()) as { subject_ids?: unknown[] } | null;

        if (!classData) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Subjects added to class",
            subjects: classData.subject_ids || []
        });
    } catch (error: any) {
        console.error("[POST /api/classes/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to add subjects" },
            { status: error.status || 500 }
        );
    }
}

/**
 * DELETE /api/classes/[id]/subjects/[subjectId]
 * Remove a subject from a class
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = authenticateRequest(sessionRequest(request), "school");
        assertPermission(session, "classes", "update");

        await connectDb();
        const { id } = await params;

        const url = new URL(request.url);
        const subjectId = url.pathname.split("/").pop();

        if (!subjectId) {
            return NextResponse.json(
                { error: "Subject ID is required" },
                { status: 400 }
            );
        }

        // Remove subject from class
        const classData = (await ClassModel.findByIdAndUpdate(
            id,
            { $pull: { subject_ids: new Types.ObjectId(subjectId) } },
            { new: true }
        )
            .populate({
                path: "subject_ids",
                select: "_id name code description status"
            })
            .lean()) as { subject_ids?: unknown[] } | null;

        if (!classData) {
            return NextResponse.json(
                { error: "Class not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: "Subject removed from class",
            subjects: classData.subject_ids || []
        });
    } catch (error: any) {
        console.error("[DELETE /api/classes/[id]/subjects] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to remove subject" },
            { status: error.status || 500 }
        );
    }
}
