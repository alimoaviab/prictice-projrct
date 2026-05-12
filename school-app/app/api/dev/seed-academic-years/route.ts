import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";

export async function GET(request: Request) {
  try {
    await connectDb();
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("school_id") || "school_001";

    const sessions = [];
    const baseYear = 2025;

    for (let i = 0; i < 20; i++) {
        const startYear = baseYear + i;
        const endYear = startYear + 1;
        sessions.push({
            school_id: schoolId,
            year: `${startYear}-${endYear}`,
            start_date: new Date(`${startYear}-01-01`),
            end_date: new Date(`${startYear}-12-31`),
            is_active: false,
            status: "draft",
            description: `Generated session for ${startYear}-${endYear}`
        });
    }

    await AcademicYearModel.insertMany(sessions);

    return NextResponse.json({ ok: true, message: "20 academic years created." });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
