import { Types } from "mongoose";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ClassModel } from "../models/class.model";
import { AttendanceModel } from "../models/attendance.model";
import { ExamModel } from "../models/exam.model";
import { LeaveModel } from "../models/leave.model";
import { AuditLogModel } from "../models/audit-log.model";
import { FeeModel } from "../models/fee.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";

export async function getAdminDashboardStats(ctx: RequestContext, academicYearId?: string): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    await connectDb();
    
    const ayId = academicYearId || ctx.active_academic_year_id;
    const filter = tenantFilter(ctx);
    
    // Academic year specific filter
    const ayFilter: any = { ...filter };
    if (ayId) ayFilter.academic_year_id = new Types.ObjectId(ayId);

    // 1. Core KPIs
    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      StudentModel.countDocuments(filter),
      TeacherModel.countDocuments(filter),
      ClassModel.countDocuments(filter)
    ]);

    // 2. Attendance Intelligence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceToday = await AttendanceModel.find({
      ...filter,
      date: { $gte: today, $lt: tomorrow }
    }).lean();

    const present = attendanceToday.filter(a => a.status === "present").length;
    const absent = attendanceToday.filter(a => a.status === "absent").length;
    const totalAttendanceMarked = attendanceToday.length;
    const attendancePercentage = totalAttendanceMarked > 0 ? Math.round((present / totalAttendanceMarked) * 100) : 0;

    // 3. Fee Collection Intelligence
    const feeStats = await FeeModel.aggregate([
      { $match: ayFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          paid: { $sum: "$paid_amount" },
          pending_count: { $sum: { $cond: [{ $eq: ["$status", "unpaid"] }, 1, 0] } }
        }
      }
    ]);

    const feeCollection = feeStats[0] || { total: 0, paid: 0, pending_count: 0 };
    const feePercentage = feeCollection.total > 0 ? Math.round((feeCollection.paid / feeCollection.total) * 100) : 0;

    // 4. Operational Metrics
    const activeExams = await ExamModel.countDocuments({
      ...ayFilter,
      status: { $in: ["scheduled", "published"] }
    });

    const pendingLeave = await LeaveModel.countDocuments({
      ...filter,
      status: "pending"
    });

    // 5. Activity Feed
    const activities = await AuditLogModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 6. System Alerts
    const alerts = [];
    if (totalStudents > 0 && totalAttendanceMarked === 0) {
      alerts.push({
        severity: "warning",
        title: "Attendance Void",
        message: "No attendance has been recorded for today yet.",
        cta: "Mark Attendance",
        link: "/admin/attendance"
      });
    }

    const classesWithAttendance = new Set(attendanceToday.map(a => String(a.class_id)));
    if (classesWithAttendance.size > 0 && classesWithAttendance.size < totalClasses) {
        alerts.push({
            severity: "info",
            title: "Partial Roster",
            message: `${totalClasses - classesWithAttendance.size} classes still pending attendance.`,
            cta: "View Status",
            link: "/admin/attendance"
        });
    }

    // 7. Class-wise Breakdown
    const classAttendance = [];
    if (totalAttendanceMarked > 0) {
        const classes = await ClassModel.find(filter).select("name").lean();
        for (const cls of classes) {
            const clsAttendance = attendanceToday.filter(a => String(a.class_id) === String(cls._id));
            if (clsAttendance.length > 0) {
                const clsPresent = clsAttendance.filter(a => a.status === "present").length;
                classAttendance.push({
                    class_name: cls.name,
                    percentage: Math.round((clsPresent / clsAttendance.length) * 100)
                });
            }
        }
    }

    // 8. Trends (Last 7 days attendance)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const endD = new Date(d);
        endD.setDate(d.getDate() + 1);

        const dayAttendance = await AttendanceModel.find({
            ...filter,
            date: { $gte: d, $lt: endD }
        }).select("status").lean();

        const dayPresent = dayAttendance.filter(a => a.status === "present").length;
        trends.push({
            date: d.toLocaleDateString("en-US", { weekday: "short" }),
            percentage: dayAttendance.length > 0 ? Math.round((dayPresent / dayAttendance.length) * 100) : 0
        });
    }

    return {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceToday: attendancePercentage,
        attendanceDetailed: { present, absent, total: totalAttendanceMarked },
        activeExams,
        pendingLeave,
        feeCollection: { 
          total: feeCollection.total, 
          paid: feeCollection.paid, 
          percentage: feePercentage, 
          pending_count: feeCollection.pending_count 
        }
      },
      activities: activities.map(a => ({
        _id: String(a._id),
        action: a.action,
        entity_type: a.entity_type,
        actor_email: a.actor_email || "system@eduplexo.com",
        created_at: (a as any).createdAt || new Date()
      })),
      alerts,
      classAttendance: classAttendance.sort((a, b) => b.percentage - a.percentage),
      trends
    };
  });
}
