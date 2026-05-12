import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { deleteTeacher, updateTeacher } from "@edu/shared/services/teacher.service";
import { getTeacherDashboardData } from "@edu/shared/services/teacher-portal.service";
import { connectDb } from "@edu/shared/db/connect";
import { tenantFilter } from "@edu/shared/db/tenant-query";
import { TeacherModel } from "@edu/shared/models/teacher.model";

function parseCookies(cookieHeader: string | null) {
  return Object.fromEntries(
    (cookieHeader?.split("; ") ?? []).map((entry) => {
      const separatorIndex = entry.indexOf("=");
      return separatorIndex >= 0 ? [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)] : [entry, ""];
    })
  );
}

function getRequestContext(request: Request) {
  return authenticateRequest(
    {
      cookies: parseCookies(request.headers.get("cookie")),
      headers: Object.fromEntries(request.headers.entries())
    },
    "school"
  );
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  
  // If role is teacher, return full dashboard payload
  if (ctx.role === "teacher" || id === "session") {
     const result = await getTeacherDashboardData(ctx, id);
     return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  }

  await connectDb();
  const result = await TeacherModel.findOne(tenantFilter(ctx, { _id: id })).lean();
  if (!result) {
    return NextResponse.json(
      { ok: false, success: false, message: "Teacher not found", error: { code: "NOT_FOUND", message: "Teacher not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, success: true, data: result });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await updateTeacher(ctx, id, await request.json());
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await deleteTeacher(ctx, id);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}