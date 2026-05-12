import { NextResponse } from "next/server";

function ok(data: any = null) {
  return NextResponse.json({ ok: true, success: true, data });
}

function notFound(message = "Not found") {
  return NextResponse.json(
    { ok: false, success: false, message, error: { code: "NOT_FOUND", message } },
    { status: 404 }
  );
}

export async function GET(_req: Request, context: any) {
  const params = await context.params;
  const slug = params?.slug || [];
  const first = slug[0] || "";

  // Return sensible defaults for common list endpoints
  if (["classes", "teachers", "exams", "academic-years", "subjects", "students", "results", "attendance", "events", "behavior", "leave"].includes(first)) {
    return ok([]);
  }

  if (first === "auth") {
    // /api/auth/session or similar
    return ok(null);
  }

  return notFound();
}

export async function POST(_req: Request, context: any) {
  const params = await context.params;
  const slug = params?.slug || [];
  const first = slug[0] || "";

  // Accept create/submit operations and return success
  if (first) return ok({ success: true });
  return notFound();
}

export async function PATCH(_req: Request, context: any) {
  await context.params;
  return ok({ success: true });
}

export async function DELETE(_req: Request, context: any) {
  await context.params;
  return ok({ success: true });
}
