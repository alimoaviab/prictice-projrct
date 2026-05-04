import mongoose from "mongoose";
import { RequestContext, ServiceResult } from "../types/core";
import { 
  CreateAnnouncementDto, 
  UpdateAnnouncementDto 
} from "../validation/announcement.schema";
import { assertPermission } from "../auth/rbac";
import { AnnouncementDocModel as AnnouncementModel } from "../models/announcement.model";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";

const FEATURE = "announcements" as const;

export async function createAnnouncement(
  ctx: RequestContext,
  data: CreateAnnouncementDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "create");

  try {
    await connectDb();
    const announcement = await AnnouncementModel.create({
      ...data,
      school_id: ctx.school_id,
      created_by: ctx.user_id,
    });

    return {
      ok: true,
      success: true,
      data: announcement.toObject(),
      message: "Announcement created successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "CREATE_FAILED", message: "Failed to create announcement" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAnnouncement(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    const announcement = await AnnouncementModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("created_by", "first_name last_name")
      .lean();

    if (!announcement) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Announcement not found" },
        message: "Announcement not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: announcement,
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch announcement" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function listAnnouncements(
  ctx: RequestContext,
  query: any = {}
): Promise<ServiceResult<any[]>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    const filter = tenantFilter(ctx, query);
    const announcements = await AnnouncementModel.find(filter)
      .sort({ created_at: -1 })
      .lean();

    return {
      ok: true,
      success: true,
      data: announcements,
      meta: { count: announcements.length },
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch announcements" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateAnnouncement(
  ctx: RequestContext,
  id: string,
  data: UpdateAnnouncementDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "update");

  try {
    await connectDb();
    const announcement = await AnnouncementModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { ...data, updated_at: new Date() },
      { new: true, lean: true }
    );

    if (!announcement) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Announcement not found" },
        message: "Announcement not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: announcement,
      message: "Announcement updated successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "UPDATE_FAILED", message: "Failed to update announcement" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteAnnouncement(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<null>> {
  assertPermission(ctx, FEATURE, "delete");

  try {
    await connectDb();
    const result = await AnnouncementModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    if (!result) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Announcement not found" },
        message: "Announcement not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: null,
      message: "Announcement deleted successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "DELETE_FAILED", message: "Failed to delete announcement" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
