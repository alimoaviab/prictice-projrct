import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { deleteStudent, updateStudent } from "@edu/shared/services/student.service";
import { connectDb } from "@edu/shared/db/connect";
import { tenantFilter } from "@edu/shared/db/tenant-query";
import { StudentModel } from "@edu/shared/models/student.model";

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
  await connectDb();
  const result = await StudentModel.findOne(tenantFilter(ctx, { _id: id })).lean();
  if (!result) {
    return NextResponse.json(
      { ok: false, success: false, message: "Student not found", error: { code: "NOT_FOUND", message: "Student not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, success: true, data: result });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await updateStudent(ctx, id, await request.json());
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await deleteStudent(ctx, id);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}