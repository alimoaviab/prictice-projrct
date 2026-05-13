import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AttendanceModel } from "../models/attendance.model";
import { ExamModel } from "../models/exam.model";
import { FeeModel } from "../models/fee.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";

export async function attendancePercentage(
  ctx: RequestContext,
  from: Date,
  to: Date
): Promise<ServiceResult<{ percentage: number; total: number }>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "reports", "view");

    const [result] = await AttendanceModel.aggregate([
      { $match: tenantFilter(ctx, { date: { $gte: from, $lte: to } }) },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          percentage: {
            $cond: [{ $eq: ["$total", 0] }, 0, { $multiply: [{ $divide: ["$present", "$total"] }, 100] }]
          }
        }
      }
    ]);

    return result ?? { percentage: 0, total: 0 };
  });
}

export async function financialSummary(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "fees", "view");

    return FeeModel.aggregate([
      { $match: tenantFilter(ctx) },
      {
        $group: {
          _id: "$status",
          amount: { $sum: "$amount" },
          paid_amount: { $sum: "$paid_amount" },
          count: { $sum: 1 }
        }
      }
    ]);
  });
}

export async function performanceTrends(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    return ExamModel.aggregate([
      { $match: tenantFilter(ctx, { status: "completed" }) },
      { $unwind: "$marks" },
      {
        $group: {
          _id: { subject: "$subject", student_id: "$marks.student_id" },
          average: { $avg: "$marks.marks_obtained" },
          exams: { $sum: 1 }
        }
      },
      { $sort: { "_id.subject": 1, average: 1 } }
    ]);
  });
}
