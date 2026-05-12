import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get("academicYearId");

  // Mock fee classes summary
  const data = {
    classes: [],
    total: 0,
    summary: {
      totalExpected: 0,
      totalCollected: 0,
      totalPending: 0,
      collectionRate: 0
    }
  };

  return NextResponse.json({ ok: true, data });
}
