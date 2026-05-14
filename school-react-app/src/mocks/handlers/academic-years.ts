import { http, HttpResponse } from "msw";
import { db } from "../db";
import { buildMockJwt } from "../auth-token";

export const academicYearHandlers = [
  http.get("/api/academic-years", () =>
    HttpResponse.json({ ok: true, data: db.academicYears })
  ),

  http.post("/api/academic-years/switch", async ({ request }) => {
    const body = (await request.json()) as { academic_year_id?: string };
    const target = db.academicYears.find((ay) => ay._id === body.academic_year_id);
    if (!target) {
      return HttpResponse.json(
        {
          ok: false,
          error: { code: "NOT_FOUND", message: "Academic year not found" },
        },
        { status: 404 }
      );
    }

    // Re-issue a JWT with the new active year, exactly like the original
    // POST /api/academic-years/switch endpoint does.
    const token = buildMockJwt({
      sub: "user_admin",
      email: "admin@school.test",
      role: "admin",
      schoolId: db.schoolId,
      activeAcademicYearId: target._id,
    });

    return HttpResponse.json({
      ok: true,
      data: { token, active_academic_year_id: target._id },
    });
  }),
];
