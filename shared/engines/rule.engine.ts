import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AttendanceModel } from "../models/attendance.model";
import { FeeModel } from "../models/fee.model";
import { StudentModel } from "../models/student.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { triggerNotification } from "./notification.engine";

export async function evaluateAttendanceRules(
  ctx: RequestContext,
  from: Date,
  to: Date
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "view");

    const lowAttendance = await AttendanceModel.aggregate([
      { $match: tenantFilter(ctx, { date: { $gte: from, $lte: to } }) },
      {
        $group: {
          _id: "$student_id",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          student_id: "$_id",
          percentage: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }]
          }
        }
      },
      { $match: { percentage: { $lt: 70 } } }
    ]);

    return lowAttendance;
  });
}

export async function evaluateFeeDueRules(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "fees", "view");

    const overdueFees = await FeeModel.find(tenantFilter(ctx, {
      status: { $in: ["unpaid", "partial"] },
      due_at: { $lt: new Date() }
    }))
      .limit(100)
      .lean();

    return overdueFees;
  });
}

export async function notifyRepeatedAbsenceInsight(
  ctx: RequestContext,
  studentIds: string[],
  recipientUserId: string
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "view");

    const students = await StudentModel.find(tenantFilter(ctx, {
      _id: { $in: studentIds }
    }))
      .select("_id first_name last_name")
      .lean();

    const message = `${students.length} students absent repeatedly.`;
    const notifications = await Promise.all(
      students.map((student) =>
        triggerNotification(ctx, {
          recipient_user_id: recipientUserId,
          title: "Attendance risk",
          body: message,
          trigger: "attendance_warning",
          entity_type: "student",
          entity_id: String(student._id)
        })
      )
    );

    return notifications;
  });
}
