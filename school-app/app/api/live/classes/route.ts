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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = authenticateRequest(sessionRequest(req), "school");
    if (ctx.role !== "admin" && ctx.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    if (ctx.role === "teacher") {
      body.teacherId = ctx.user_id;
    } else if (!body.teacherId) {
      return NextResponse.json({ success: false, error: "teacherId is required" }, { status: 400 });
    }

    const liveClass = await LiveClassService.createClass(ctx, body);
    return NextResponse.json({ success: true, data: liveClass }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
