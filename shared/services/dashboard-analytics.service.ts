import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { AttendanceModel } from "../models/attendance.model";
import { ExamModel } from "../models/exam.model";
import { FeeModel } from "../models/fee.model";
import { LeaveModel } from "../models/leave.model";
import { TimetableModel } from "../models/timetable.model";
import { ClassModel } from "../models/class.model";

export class DashboardAnalyticsService {
  static async getOverviewStats(school_id: string) {
    const schoolId = school_id.trim();

    const [totalStudents, totalTeachers, activeExams, pendingLeave] = await Promise.all([
      StudentModel.countDocuments({ school_id: schoolId, status: "active" }),
      TeacherModel.countDocuments({ school_id: schoolId, status: "active" }),
      ExamModel.countDocuments({ 
        school_id: schoolId, 
        status: { $in: ["created", "scheduled"] },
        exam_date: { $gte: new Date() }
      }),
      LeaveModel.countDocuments({ school_id: schoolId, status: "pending" })
    ]);

    // Attendance Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendanceStats = await AttendanceModel.aggregate([
      { 
        $match: { 
          school_id: schoolId, 
          date: { $gte: today, $lt: tomorrow } 
        } 
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

    // Fee collection (simple aggregation for this example)
    const feeStats = await FeeModel.aggregate([
      { $match: { school_id: schoolId } },
      {
        $group: {
          _id: null,
          total_amount: { $sum: "$amount" },
          total_paid: { $sum: "$paid_amount" }
        }
      }
    ]);

    const feeCollection = feeStats.length > 0
      ? { 
          total: feeStats[0].total_amount, 
          paid: feeStats[0].total_paid,
          percentage: Math.round((feeStats[0].total_paid / feeStats[0].total_amount) * 100)
        }
      : { total: 0, paid: 0, percentage: 0 };

    return {
      totalStudents,
      totalTeachers,
      attendanceToday,
      activeExams,
      pendingLeave,
      feeCollection
    };
  }

  static async getClassAttendance(school_id: string) {
    const schoolId = school_id.trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await AttendanceModel.aggregate([
      { 
        $match: { 
          school_id: schoolId, 
          date: { $gte: today } 
        } 
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
          localField: "_id",
          foreignField: "_id",
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

  static async getAttendanceTrends(school_id: string, days: number = 7) {
    const schoolId = school_id.trim();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trends = await AttendanceModel.aggregate([
      {
        $match: {
          school_id: schoolId,
          date: { $gte: startDate }
        }
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
      percentage: Math.round((t.present / t.total) * 100)
    }));
  }

  static async getSystemAlerts(school_id: string) {
    const schoolId = school_id.trim();
    const alerts = [];

    // 1. Check for low attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendanceStats = await AttendanceModel.aggregate([
      { $match: { school_id: schoolId, date: { $gte: today } } },
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
    const pendingLeave = await LeaveModel.countDocuments({ school_id: schoolId, status: "pending" });
    if (pendingLeave > 0) {
      alerts.push({
        severity: "warning",
        title: "Pending Leave Requests",
        message: `There are ${pendingLeave} teacher leave requests waiting for approval.`,
        cta: "Review Now",
        link: "/admin/leave"
      });
    }

    // 3. Teachers on leave today
    const teachersOnLeave = await LeaveModel.countDocuments({
      school_id: schoolId,
      status: "approved",
      start_date: { $lte: today },
      end_date: { $gte: today }
    });
    if (teachersOnLeave > 0) {
      alerts.push({
        severity: "warning",
        title: "Teachers on Leave",
        message: `${teachersOnLeave} teacher(s) are officially on leave today.`,
        cta: "Manage Staff",
        link: "/admin/teachers"
      });
    }

    // 4. Missing Timetable Alert
    const allClasses = await ClassModel.find({ school_id: schoolId }).select("_id name").lean();
    const classesWithTimetable = await TimetableModel.distinct("class_id", { school_id: schoolId });
    const classesWithoutTimetable = allClasses.filter(c => !classesWithTimetable.map(id => String(id)).includes(String(c._id)));

    if (classesWithoutTimetable.length > 0) {
      alerts.push({
        severity: "error",
        title: "Missing Timetables",
        message: `${classesWithoutTimetable.length} class(es) have no sessions scheduled.`,
        cta: "Configure Timetable",
        link: "/admin/timetable"
      });
    }

    // 5. Upcoming exams
    const upcomingExams = await ExamModel.countDocuments({
      school_id: schoolId,
      exam_date: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
    });
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
}
