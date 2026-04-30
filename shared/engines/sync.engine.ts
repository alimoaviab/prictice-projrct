import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { SyncJobModel } from "../models/sync-job.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { writeAuditLog } from "../services/audit.service";

export interface SyncJobInput {
  idempotency_key: string;
  type: string;
  payload: unknown;
  max_attempts?: number;
}

export async function enqueueSyncJob(
  ctx: RequestContext,
  input: SyncJobInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();

    const job = await SyncJobModel.findOneAndUpdate(
      tenantFilter(ctx, { idempotency_key: input.idempotency_key }),
      {
        $setOnInsert: {
          school_id: ctx.school_id,
          idempotency_key: input.idempotency_key,
          type: input.type,
          payload: input.payload,
          max_attempts: input.max_attempts ?? Number(process.env.SYNC_MAX_ATTEMPTS ?? 8),
          status: "queued",
          next_run_at: new Date()
        }
      },
      { upsert: true, new: true }
    ).lean();

    return job;
  });
}

export async function markSyncRetry(
  ctx: RequestContext,
  id: string,
  errorMessage: string
): Promise<void> {
  const nextRun = new Date(Date.now() + 2 * 60 * 1000);
  await SyncJobModel.findOneAndUpdate(tenantFilter(ctx, { _id: id }), {
    $inc: { attempts: 1 },
    $set: { status: "queued", next_run_at: nextRun, last_error: errorMessage }
  });

  await writeAuditLog(ctx, {
    action: "sync_retry",
    entity_type: "sync_job",
    entity_id: id,
    metadata: { errorMessage, nextRun }
  });
}
