import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const academicYearId = searchParams.get("academicYearId");

  // Mock fee dashboard stats
  const data = {
    totalRevenue: 0,
    collectedAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    collectionRate: 0,
    totalStudents: 0,
    paidStudents: 0,
    partialPaidStudents: 0,
    unpaidStudents: 0,
    monthlyTrend: [],
    recentPayments: [],
    topDefaulters: []
  };

  return NextResponse.json({ ok: true, data });
}
