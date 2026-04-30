import { connectDb } from "../db/connect";
import { NotificationModel } from "../models/notification.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { enqueueSyncJob } from "./sync.engine";
import { writeAuditLog } from "../services/audit.service";

export interface NotificationInput {
  recipient_user_id: string;
  title: string;
  body: string;
  trigger: "homework_assigned" | "test_scheduled" | "fee_due" | "attendance_warning" | "low_marks";
  entity_type?: string;
  entity_id?: string;
}

export async function triggerNotification(
  ctx: RequestContext,
  input: NotificationInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();

    const notification = await NotificationModel.create({
      ...input,
      school_id: ctx.school_id,
      delivery: { status: "queued", attempts: 0 }
    });

    await enqueueSyncJob(ctx, {
      idempotency_key: `notification:${String(notification._id)}`,
      type: "deliver_notification",
      payload: { notification_id: String(notification._id) }
    });

    await writeAuditLog(ctx, {
      action: "notify",
      entity_type: "notification",
      entity_id: String(notification._id),
      after: notification.toObject()
    });

    return notification.toObject();
  });
}
