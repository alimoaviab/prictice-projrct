import { NextResponse } from "next/server";

export async function GET() {
  // Mock analytics data for dashboard
  const data = {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
    pendingFees: 0,
    attendanceRate: 0,
    recentActivities: [],
    upcomingExams: [],
    monthlyStats: {
      students: [],
      revenue: [],
      attendance: []
    }
  };

  return NextResponse.json({ ok: true, data });
}
