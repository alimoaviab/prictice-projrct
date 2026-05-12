import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { EventModel } from "../models/event.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { EventCreateInput, EventUpdateInput, eventCreateSchema, eventUpdateSchema } from "../validation/event.schema";
import { writeAuditLog } from "./audit.service";

// CREATE
export async function createEvent(
  ctx: RequestContext,
  input: EventCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "events", "create");

    const parsed = eventCreateSchema.parse(input);

    // Validate date range
    const startDate = new Date(parsed.start_date);
    const endDate = parsed.end_date ? new Date(parsed.end_date) : startDate;
    if (endDate < startDate) {
      throw new Error("End date must be after start date");
    }

    // Validate target classes if specific_classes visibility
    if (parsed.visibility === "specific_classes" && (!parsed.target_class_ids || parsed.target_class_ids.length === 0)) {
      throw new Error("Target classes are required for specific_classes visibility");
    }

    const { toObjectId } = await import("../utils/db");

    const created = await EventModel.create({
      school_id: ctx.school_id,
      title: parsed.title,
      description: parsed.description,
      event_type: parsed.event_type,
      start_date: startDate,
      end_date: endDate,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      location: parsed.location,
      visibility: parsed.visibility,
      target_class_ids: parsed.target_class_ids?.map(id => new Types.ObjectId(id)) ?? [],
      organizer: parsed.organizer,
      status: parsed.status,
      created_by: toObjectId(ctx.user_id)
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "event",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

// LIST ALL (with filters)
export async function listEvents(
  ctx: RequestContext,
  query: { status?: string; event_type?: string; visibility?: string; start_date?: string; end_date?: string; class_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "events", "view");

    const filter = tenantFilter(ctx);
    if (query.status) filter.status = query.status;
    if (query.event_type) filter.event_type = query.event_type;
    if (query.visibility) filter.visibility = query.visibility;
    if (query.class_id && Types.ObjectId.isValid(query.class_id)) {
      filter.target_class_ids = new Types.ObjectId(query.class_id);
    }
    
    // Date range filter
    if (query.start_date || query.end_date) {
      filter.start_date = {};
      if (query.start_date) (filter.start_date as any).$gte = new Date(query.start_date);
      if (query.end_date) (filter.start_date as any).$lte = new Date(query.end_date);
    }

    const rows = await EventModel.find(filter)
      .populate("created_by", "first_name last_name")
      .populate("target_class_ids", "name")
      .sort({ start_date: 1 })
      .lean();

    return rows.map((row: any) => ({
      ...row,
      _id: String(row._id),
      created_by: row.created_by ? {
        _id: String((row.created_by as any)._id),
        name: `${(row.created_by as any).first_name ?? ""} ${(row.created_by as any).last_name ?? ""}`.trim()
      } : null,
      start_date: row.start_date instanceof Date ? row.start_date.toISOString().split("T")[0] : row.start_date,
      end_date: row.end_date instanceof Date ? row.end_date.toISOString().split("T")[0] : row.end_date
    }));
  });
}

// GET SINGLE
export async function getEvent(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "events", "view");

    const row = await EventModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("created_by", "first_name last_name")
      .populate("target_class_ids", "name")
      .lean();

    if (!row) throw new Error("Event not found");

    return {
      ...row,
      _id: String((row as any)._id),
      start_date: (row as any).start_date instanceof Date ? (row as any).start_date.toISOString().split("T")[0] : (row as any).start_date,
      end_date: (row as any).end_date instanceof Date ? (row as any).end_date.toISOString().split("T")[0] : (row as any).end_date
    };
  });
}

// UPDATE
export async function updateEvent(
  ctx: RequestContext,
  id: string,
  input: EventUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "events", "update");

    const parsed = eventUpdateSchema.parse(input);
    const existing = await EventModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Event not found");

    const patch: any = { ...parsed };
    
    // Validate date range if dates are being updated
    if (parsed.start_date || parsed.end_date) {
      const startDate = parsed.start_date ? new Date(parsed.start_date) : (existing as any).start_date;
      const endDate = parsed.end_date ? new Date(parsed.end_date) : (existing as any).end_date;
      if (endDate < startDate) {
        throw new Error("End date must be after start date");
      }
      if (parsed.start_date) patch.start_date = startDate;
      if (parsed.end_date) patch.end_date = endDate;
    }

    if (parsed.target_class_ids) {
      patch.target_class_ids = parsed.target_class_ids.map(id => new Types.ObjectId(id));
    }

    // Validate target classes if visibility changed to specific_classes
    if (parsed.visibility === "specific_classes" && (!patch.target_class_ids || patch.target_class_ids.length === 0)) {
      throw new Error("Target classes are required for specific_classes visibility");
    }

    const updated = await EventModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "event",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

// DELETE
export async function deleteEvent(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "events", "delete");

    const existing = await EventModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Event not found");

    await EventModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "event",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
