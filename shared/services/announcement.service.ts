import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AnnouncementModel } from "../models/announcement.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { AnnouncementCreateInput, AnnouncementUpdateInput, announcementCreateSchema, announcementUpdateSchema } from "../validation/announcement.schema";
import { writeAuditLog } from "./audit.service";

// CREATE
export async function createAnnouncement(
  ctx: RequestContext,
  input: AnnouncementCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "announcements", "create");

    const parsed = announcementCreateSchema.parse(input);
    
    const created = await AnnouncementModel.create({
      school_id: ctx.school_id,
      title: parsed.title,
      content: parsed.content,
      target_type: parsed.target_type,
      target_ids: parsed.target_ids?.map(id => new Types.ObjectId(id)) ?? [],
      priority: parsed.priority,
      status: parsed.status,
      published_at: parsed.status === "published" ? new Date() : undefined,
      expires_at: parsed.expires_at ? new Date(parsed.expires_at) : undefined,
      created_by: new Types.ObjectId(ctx.user_id)
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "announcement",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

// LIST ALL
export async function listAnnouncements(
  ctx: RequestContext,
  query: { status?: string; target_type?: string; priority?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "announcements", "view");

    const filter = tenantFilter(ctx);
    if (query.status) filter.status = query.status;
    if (query.target_type) filter.target_type = query.target_type;
    if (query.priority) filter.priority = query.priority;

    const rows = await AnnouncementModel.find(filter)
      .populate("created_by", "first_name last_name email")
      .sort({ created_at: -1, priority: -1 })
      .lean();

    return rows.map((row: any) => ({
      ...row,
      _id: String(row._id),
      created_by: row.created_by ? {
        _id: String((row.created_by as any)._id),
        name: `${(row.created_by as any).first_name ?? ""} ${(row.created_by as any).last_name ?? ""}`.trim()
      } : null
    }));
  });
}

// GET SINGLE
export async function getAnnouncement(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "announcements", "view");

    const row = await AnnouncementModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("created_by", "first_name last_name email")
      .lean();

    if (!row) throw new Error("Announcement not found");

    return {
      ...row,
      _id: String((row as any)._id)
    };
  });
}

// UPDATE
export async function updateAnnouncement(
  ctx: RequestContext,
  id: string,
  input: AnnouncementUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "announcements", "update");

    const parsed = announcementUpdateSchema.parse(input);
    const existing = await AnnouncementModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Announcement not found");

    const patch: any = { ...parsed };
    if (parsed.target_ids) {
      patch.target_ids = parsed.target_ids.map(id => new Types.ObjectId(id));
    }
    if (parsed.status === "published" && !(existing as any).published_at) {
      patch.published_at = new Date();
    }
    if (parsed.expires_at) {
      patch.expires_at = new Date(parsed.expires_at);
    }

    const updated = await AnnouncementModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "announcement",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

// DELETE
export async function deleteAnnouncement(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "announcements", "delete");

    const existing = await AnnouncementModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Announcement not found");

    await AnnouncementModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "announcement",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
