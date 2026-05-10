import { NextResponse } from "next/server";
import { LiveClassService } from "@edu/shared/services/live/live-class.service";
import { authenticateRequest, SessionRequest } from "@edu/shared/auth/middleware";

const sessionRequest = (req: Request): SessionRequest => ({
  headers: Object.fromEntries(req.headers),
  cookies: {
     session: req.headers.get("cookie")?.split("; ").find(c => c.startsWith("session="))?.split("=")[1]
  }
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(req), "school");
    if (ctx.role !== "admin" && ctx.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const resolvedParams = await params;
    const liveClass = await LiveClassService.updateClassStatus(ctx, resolvedParams.id, body.status);
    return NextResponse.json({ success: true, data: liveClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(req), "school");
    if (ctx.role !== "admin" && ctx.role !== "teacher") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    await LiveClassService.deleteClass(ctx, resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
