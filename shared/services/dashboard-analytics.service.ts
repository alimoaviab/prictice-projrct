import { Types } from "mongoose";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { AttendanceModel } from "../models/attendance.model";
import { ExamModel } from "../models/exam.model";
import { FeeModel } from "../models/fee.model";
import { LeaveModel } from "../models/leave.model";
import { TimetableModel } from "../models/timetable.model";
import { ClassModel } from "../models/class.model";
import { AuditLogModel } from "../models/audit-log.model";
import { resolveClassIdsForAcademicYear, resolveAcademicYearId } from "./_academic-year-filter";
import { tenantFilter } from "../db/tenant-query";
import { RequestContext } from "../types/core";

export class DashboardAnalyticsService {
  static async getOverviewStats(ctx: RequestContext, academicYearId?: string) {
    const classIds = await resolveClassIdsForAcademicYear(ctx, academicYearId);
    const resolvedYearId = await resolveAcademicYearId(ctx, academicYearId);

    const [totalStudents, totalTeachers, activeExams, pendingLeave] = await Promise.all([
      StudentModel.countDocuments(tenantFilter(ctx, {
        status: "active",
        class_id: { $in: classIds }
      })),
      TeacherModel.countDocuments(tenantFilter(ctx, {
        status: "active",
        class_ids: { $in: classIds }
      })),
      ExamModel.countDocuments(tenantFilter(ctx, {
        status: { $in: ["created", "scheduled"] },
        class_id: { $in: classIds }
      })),
      LeaveModel.countDocuments(tenantFilter(ctx, { status: "pending" }))
    ]);

    // Attendance Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceStats = await AttendanceModel.aggregate([
      {
        $match: tenantFilter(ctx, {
          date: { $gte: today, $lt: tomorrow },
          class_id: { $in: classIds }
        })
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          }
        }
      }
    ]);

    const attendanceToday = attendanceStats.length > 0 
      ? Math.round((attendanceStats[0].present / attendanceStats[0].total) * 100) 
      : 0;
    
    const attendanceDetailed = attendanceStats.length > 0
      ? { 
          present: attendanceStats[0].present, 
          absent: attendanceStats[0].total - attendanceStats[0].present,
          total: attendanceStats[0].total
        }
      : { present: 0, absent: 0, total: 0 };

    // Fee collection
    const feeStats = await FeeModel.aggregate([
      {
        $match: tenantFilter(ctx, {
          academic_year_id: resolvedYearId ? new Types.ObjectId(resolvedYearId) : null
        })
      },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
          total_paid: { $sum: "$paid_amount" },
          pending_count: { $sum: { $cond: [{ $lt: ["$paid_amount", "$amount"] }, 1, 0] } }
        }
      }
    ]);

    const feeCollection = feeStats.length > 0
      ? { 
          total: feeStats[0].total_amount, 
          paid: feeStats[0].total_paid,
          percentage: feeStats[0].total_amount > 0 ? Math.round((feeStats[0].total_paid / feeStats[0].total_amount) * 100) : 0,
          pending_count: feeStats[0].pending_count
        }
      : { total: 0, paid: 0, percentage: 0, pending_count: 0 };

    return {
      totalStudents,
      totalTeachers,
      attendanceToday,
      attendanceDetailed,
      activeExams,
      pendingLeave,
      feeCollection
    };
  }

  static async getClassAttendance(ctx: RequestContext, academicYearId?: string) {
    const classIds = await resolveClassIdsForAcademicYear(ctx, academicYearId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await AttendanceModel.aggregate([
      {
        $match: tenantFilter(ctx, {
          date: { $gte: today },
          class_id: { $in: classIds }
        })
      },
      {
        $group: {
          _id: "$class_id",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "classes",
          let: { cid: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [
              { $eq: ["$_id", "$$cid"] },
              { $eq: ["$school_id", ctx.school_id] }
            ] } } }
          ],
          as: "class_info"
        }
      },
      { $unwind: "$class_info" },
      {
        $project: {
          class_name: "$class_info.name",
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$present", "$total"] }, 100] }, 1] },
              0
            ]
          }
        }
      },
      { $sort: { percentage: -1 } }
    ]);

    return stats;
  }

  static async getAttendanceTrends(ctx: RequestContext, academicYearId?: string, days: number = 7) {
    const classIds = await resolveClassIdsForAcademicYear(ctx, academicYearId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends = await AttendanceModel.aggregate([
      {
        $match: tenantFilter(ctx, {
          date: { $gte: startDate },
          class_id: { $in: classIds }
        })
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    return trends.map(t => ({
      date: t._id,
      percentage: t.total > 0 ? Math.round((t.present / t.total) * 100) : 0
    }));
  }

  static async getSystemAlerts(ctx: RequestContext, academicYearId?: string) {
    const classIds = await resolveClassIdsForAcademicYear(ctx, academicYearId);
    const alerts = [];

    // 1. Check for low attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceStats = await AttendanceModel.aggregate([
      { $match: tenantFilter(ctx, { date: { $gte: today }, class_id: { $in: classIds } }) },
      { $group: { _id: "$class_id", total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } } } }
    ]);

    for (const stat of attendanceStats) {
      const percentage = (stat.present / stat.total) * 100;
      if (percentage < 75) {
        alerts.push({
          severity: "error",
          title: "Low Attendance Alert",
          message: `Class attendance is below 75% (${Math.round(percentage)}%)`,
          cta: "View Attendance",
          link: "/admin/attendance"
        });
      }
    }

    // 2. Check for pending leave requests
    const pendingLeave = await LeaveModel.countDocuments(tenantFilter(ctx, { status: "pending" }));
    if (pendingLeave > 0) {
      alerts.push({
        severity: "warning",
        title: "Pending Leave Requests",
        message: `There are ${pendingLeave} teacher leave requests waiting for approval.`,
        cta: "Review Now",
        link: "/admin/leave"
      });
    }

    // 4. Missing Timetable Alert
    const resolvedYearId = await resolveAcademicYearId(ctx, academicYearId);
    const classesForYear = await ClassModel.find(tenantFilter(ctx, {
      academic_year_id: resolvedYearId ? new Types.ObjectId(resolvedYearId) : { $exists: true }
    })).select("_id name").lean();

    const classesWithTimetable = await TimetableModel.distinct("class_id", tenantFilter(ctx, {
      class_id: { $in: classIds }
    }));
    const classesWithoutTimetable = classesForYear.filter(c => !classesWithTimetable.map(id => String(id)).includes(String(c._id)));

    if (classesWithoutTimetable.length > 0) {
      alerts.push({
        severity: "error",
        title: "Missing Timetables",
        message: `${classesWithoutTimetable.length} class(es) have no sessions scheduled for the selected year.`,
        cta: "Configure Timetable",
        link: "/admin/timetable"
      });
    }

    // 5. Upcoming exams
    const upcomingExams = await ExamModel.countDocuments(tenantFilter(ctx, {
      starts_at: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      class_id: { $in: classIds }
    }));
    if (upcomingExams > 0) {
      alerts.push({
        severity: "info",
        title: "Upcoming Exams",
        message: `${upcomingExams} exams scheduled in the next 7 days.`,
        cta: "View Schedule",
        link: "/admin/exams"
      });
    }

    return alerts;
  }

  static async getRecentActivity(ctx: RequestContext) {
    return AuditLogModel.find(tenantFilter(ctx))
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
  }
}
