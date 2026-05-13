import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { LiveClassService } from "@edu/shared/services/live/live-class.service";

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((entry) => {
      const i = entry.indexOf("=");
      return i >= 0 ? [entry.slice(0, i), entry.slice(i + 1)] : [entry, ""];
    })
  );
}

function getContext(request: Request) {
  return authenticateRequest(
    {
      cookies: parseCookies(request.headers.get("cookie")),
      headers: Object.fromEntries(request.headers.entries())
    },
    "school"
  );
}

/**
 * Live Classes API — tenant-isolated.
 *
 * Replaces the previous in-memory mock that shared a single array across
 * every request and tenant. All reads/writes now go through
 * LiveClassService which enforces tenantFilter(ctx).
 */
export async function GET(request: Request) {
  try {
    await connectDb();
    const ctx = getContext(request);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const teacherId = searchParams.get("teacherId") || undefined;
    const classId = searchParams.get("classId") || undefined;
    const date = searchParams.get("date") || undefined;

    const data = await LiveClassService.getClasses(ctx, {
      ...(status ? { status } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(classId ? { classId } : {}),
      ...(date ? { date } : {})
    });

    return NextResponse.json({ ok: true, success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: error?.message || "Failed to load live classes",
        error: { message: error?.message || "Failed to load live classes", status: error?.status || 500 }
      },
      { status: error?.status || 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDb();
    const ctx = getContext(request);
    const body = await request.json();

    if (!body.title || !body.classId || !body.subjectId || !body.startTime || !body.endTime) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message: "Missing required fields: title, classId, subjectId, startTime, endTime",
          error: { message: "Missing required fields", status: 400 }
        },
        { status: 400 }
      );
    }

    // Resolve teacherId — if requester is a teacher, lock to their own profile
    let teacherId = String(body.teacherId || "");
    if (ctx.role === "teacher" && !teacherId) {
      teacherId = ctx.user_id;
    }
    if (!teacherId) {
      return NextResponse.json(
        { ok: false, success: false, message: "teacherId is required", error: { message: "teacherId is required", status: 400 } },
        { status: 400 }
      );
    }

    const created = await LiveClassService.createClass(ctx, {
      title: body.title,
      teacherId,
      classId: body.classId,
      subjectId: body.subjectId,
      sectionId: body.sectionId,
      startTime: body.startTime,
      endTime: body.endTime
    });

    return NextResponse.json({ ok: true, success: true, data: created });
  } catch (error: any) {
    console.error("Error creating live class:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: error?.message || "Failed to create live class",
        error: { message: error?.message || "Failed to create live class", status: error?.status || 500 }
      },
      { status: error?.status || 500 }
    );
  }
}
