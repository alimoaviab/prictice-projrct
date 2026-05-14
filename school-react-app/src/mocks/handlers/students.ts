import { http, HttpResponse } from "msw";
import { db } from "../db";
import type { MockStudent } from "../db";

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const studentHandlers = [
  http.get("/api/students", ({ request }) => {
    const url = new URL(request.url);
    const classId = url.searchParams.get("class_id");
    const status = url.searchParams.get("status");

    let rows = db.students.slice();
    if (classId) rows = rows.filter((r) => r.class_id === classId);
    if (status) rows = rows.filter((r) => r.status === status);

    return HttpResponse.json({ ok: true, data: rows });
  }),

  http.post("/api/students", async ({ request }) => {
    const body = (await request.json()) as Partial<MockStudent>;
    const row: MockStudent = {
      _id: genId("stu"),
      school_id: db.schoolId,
      academic_year_id:
        db.academicYears.find((ay) => ay.is_active)?._id ??
        db.academicYears[0]._id,
      admission_no: body.admission_no ?? `ADM-${Date.now()}`,
      first_name: body.first_name ?? "",
      last_name: body.last_name ?? "",
      class_id: body.class_id ?? db.classes[0]._id,
      section: body.section ?? "A",
      subjects: body.subjects ?? [],
      guardian: body.guardian ?? { name: "", phone: "" },
      status: body.status ?? "active",
    };
    db.students.push(row);
    return HttpResponse.json({ ok: true, data: row }, { status: 201 });
  }),

  http.patch("/api/students/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<MockStudent>;
    const idx = db.students.findIndex((s) => s._id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Student not found" } },
        { status: 404 }
      );
    }
    db.students[idx] = { ...db.students[idx], ...body } as MockStudent;
    return HttpResponse.json({ ok: true, data: db.students[idx] });
  }),

  http.delete("/api/students/:id", ({ params }) => {
    const idx = db.students.findIndex((s) => s._id === params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Student not found" } },
        { status: 404 }
      );
    }
    db.students.splice(idx, 1);
    return HttpResponse.json({
      ok: true,
      data: { success: true, id: params.id as string },
    });
  }),
];
