import { NextResponse } from "next/server";
import { StudentModel } from "@edu/shared/models";
import { LiveClassService } from "@edu/shared/services/live/live-class.service";
import { authenticateRequest, SessionRequest } from "@edu/shared/auth/middleware";

const sessionRequest = (req: Request): SessionRequest => ({
  headers: Object.fromEntries(req.headers),
  cookies: {
     session: req.headers.get("cookie")?.split("; ").find(c => c.startsWith("session="))?.split("=")[1]
  }
});

export async function GET(req: Request) {
  try {
    const ctx = authenticateRequest(sessionRequest(req), "school");
    const { searchParams } = new URL(req.url);
    const role = ctx.role;

    const filters: any = {};
    if (role === "teacher") filters.teacherId = ctx.user_id;
    else if (role === "student") {
      const classId = searchParams.get("classId");
      if (classId) {
        filters.classId = classId;
      } else {
        const student = await StudentModel.findOne({
          school_id: ctx.school_id,
          user_id: ctx.user_id,
          status: "active"
        }).lean();

        if ((student as any)?.class_id) {
          filters.classId = String((student as any).class_id);
        }
      }
    }

    if (searchParams.has("status")) filters.status = searchParams.get("status");
    if (searchParams.has("date")) filters.date = searchParams.get("date");

    const classes = await LiveClassService.getClasses(ctx, filters);
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    console.error("[GET /api/live/classes] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = authenticateRequest(sessionRequest(req), "school");
    if (ctx.role !== "admin" && ctx.role !== "teacher") {
      console.error("[POST /api/live/classes] Unauthorized role:", ctx.role);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    console.info("[POST /api/live/classes] Request body:", {
      title: body.title,
      classId: body.classId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      startTime: body.startTime,
      endTime: body.endTime
    });

    if (ctx.role === "teacher") {
      body.teacherId = ctx.user_id;
    } else if (!body.teacherId) {
      console.error("[POST /api/live/classes] Missing teacherId");
      return NextResponse.json({ success: false, error: "teacherId is required" }, { status: 400 });
    }

    console.info("[POST /api/live/classes] Creating live class...");
    const liveClass = await LiveClassService.createClass(ctx, body);
    
    console.info("[POST /api/live/classes] Live class created successfully", {
      id: liveClass._id,
      meetingLink: liveClass.meetingLink,
      status: liveClass.status
    });

    // Convert to plain object and ensure all fields are included
    const classData = liveClass.toObject ? liveClass.toObject() : liveClass;
    
    // Return with meeting link included
    return NextResponse.json({ 
      success: true, 
      data: {
        _id: classData._id,
        title: classData.title,
        teacherId: classData.teacherId,
        classId: classData.classId,
        subjectId: classData.subjectId,
        meetingLink: classData.meetingLink,
        meetingId: classData.meetingId,
        startTime: classData.startTime,
        endTime: classData.endTime,
        status: classData.status,
        createdBy: classData.createdBy,
        createdAt: classData.createdAt,
        updatedAt: classData.updatedAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/live/classes] Error:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to create live class" 
    }, { status: 400 });
  }
}
