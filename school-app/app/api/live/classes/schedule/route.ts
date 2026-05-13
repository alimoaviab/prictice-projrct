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

/**
 * Tenant-isolated live-class scheduling endpoint.
 *
 * Previously this returned a mock response with an arbitrary client-supplied
 * meeting link. It now persists through LiveClassService which enforces
 * school_id scoping and resolves Google Meet integration server-side.
 */
export async function POST(request: Request) {
  try {
    await connectDb();
    const ctx = authenticateRequest(
      {
        cookies: parseCookies(request.headers.get("cookie")),
        headers: Object.fromEntries(request.headers.entries())
      },
      "school"
    );

    const body = await request.json();
    const { title, description, startTime, endTime, classId, subjectId, sectionId, teacherId } = body;

    if (!title || !startTime || !endTime || !classId || !subjectId) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing required fields: title, startTime, endTime, classId, subjectId" } },
        { status: 400 }
      );
    }

    // Lock teacher scheduling to the requesting teacher
    const resolvedTeacherId = ctx.role === "teacher"
      ? ctx.user_id
      : String(teacherId || ctx.user_id);

    const created = await LiveClassService.createClass(ctx, {
      title,
      teacherId: resolvedTeacherId,
      classId,
      subjectId,
      sectionId,
      startTime,
      endTime
    });

    return NextResponse.json({
      ok: true,
      data: {
        success: true,
        message: "Live class scheduled successfully",
        liveClass: created
      }
    });
  } catch (error: any) {
    console.error("❌ Schedule live class error:", error);
    return NextResponse.json(
      { ok: false, error: { message: error?.message || "Failed to schedule live class" } },
      { status: error?.status || 500 }
    );
  }
}
