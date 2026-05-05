import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import {
  AcademicYearCreateInput,
  AcademicYearUpdateInput,
  academicYearCreateSchema,
  academicYearUpdateSchema
} from "../validation/academic-year.schema";
import { writeAuditLog } from "./audit.service";

type AcademicYearRecord = {
  _id: unknown;
  school_id: string;
  year: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  description?: string;
  status: "draft" | "active" | "completed" | "cancelled";
};

type AcademicYearResponse = {
  _id: string;
  id: string;
  year: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  status: "draft" | "active" | "completed" | "cancelled";
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  days_completed?: number;
  days_remaining?: number;
};

function toAcademicYearResponse(record: AcademicYearRecord & { created_at?: Date; updated_at?: Date }): AcademicYearResponse {
  return {
    _id: String(record._id),
    id: String(record._id),
    year: record.year,
    name: record.year,
    start_date: record.start_date,
    end_date: record.end_date,
    is_active: record.is_active,
    status: record.status,
    description: record.description,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
}

function calcDaySpan(startDate: Date, endDate: Date) {
  const dayMs = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
  const now = new Date();
  const completed = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - startDate.getTime()) / dayMs)));
  return {
    days_completed: completed,
    days_remaining: Math.max(0, totalDays - completed)
  };
}

function deriveStatus(startDate: Date, endDate: Date, isActive: boolean) {
  if (isActive) {
    return "active" as const;
  }

  const now = new Date();
  if (endDate < now) {
    return "completed" as const;
  }

  if (startDate > now) {
    return "draft" as const;
  }

  return "cancelled" as const;
}

export async function listAcademicYears(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "view");
    const records = (await AcademicYearModel.find(tenantFilter(ctx)).sort({ start_date: -1 }).lean()) as unknown as AcademicYearRecord[];
    return records.map(toAcademicYearResponse);
  });
}

export async function getAcademicYear(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "view");

    const record = (await AcademicYearModel.findOne(tenantFilter(ctx, { _id: id })).lean()) as AcademicYearRecord | null;
    if (!record) {
      throw new ControlledError("NOT_FOUND", "Academic year not found.", 404);
    }

    return toAcademicYearResponse(record as AcademicYearRecord & { created_at?: Date; updated_at?: Date });
  });
}

export async function getCurrentAcademicYear(ctx: RequestContext): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "view");

    const record = (await AcademicYearModel.findOne(
      tenantFilter(ctx, { is_active: true })
    ).sort({ start_date: -1 }).lean()) as AcademicYearRecord | null;

    if (!record) {
      throw new ControlledError("NOT_FOUND", "Current academic year not found.", 404);
    }

    return {
      ...toAcademicYearResponse(record as AcademicYearRecord & { created_at?: Date; updated_at?: Date }),
      ...calcDaySpan(record.start_date, record.end_date)
    };
  });
}

export async function createAcademicYear(
  ctx: RequestContext,
  input: AcademicYearCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "create");

    const normalizedInput = {
      ...input,
      year: input.year ?? (input as any).name
    } as AcademicYearCreateInput & { name?: string };
    const parsed = academicYearCreateSchema.parse(normalizedInput);
    if (parsed.is_active) {
      await AcademicYearModel.updateMany(tenantFilter(ctx), { $set: { is_active: false } });
    }

    const created = await AcademicYearModel.create({
      ...parsed,
      school_id: ctx.school_id,
      status: deriveStatus(parsed.start_date, parsed.end_date, parsed.is_active)
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "class",
      entity_id: String(created._id),
      after: created.toObject(),
      metadata: { scope: "academic_year" }
    });

    return toAcademicYearResponse(created.toObject() as AcademicYearRecord & { created_at?: Date; updated_at?: Date });
  });
}

export async function updateAcademicYear(
  ctx: RequestContext,
  id: string,
  input: AcademicYearUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "update");

    const normalizedInput = {
      ...input,
      year: input.year ?? (input as any).name
    } as AcademicYearUpdateInput & { name?: string };
    const parsed = academicYearUpdateSchema.parse(normalizedInput);
    const existing = (await AcademicYearModel.findOne(tenantFilter(ctx, { _id: id })).lean()) as unknown as AcademicYearRecord | null;
    if (!existing) {
      throw new Error("Academic year not found.");
    }

    const nextStartDate = parsed.start_date ?? existing.start_date;
    const nextEndDate = parsed.end_date ?? existing.end_date;
    const nextIsActive = parsed.is_active ?? existing.is_active;

    if (nextIsActive) {
      await AcademicYearModel.updateMany(tenantFilter(ctx), { $set: { is_active: false } });
    }

    const updated = (await AcademicYearModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      {
        $set: {
          ...parsed,
          status: deriveStatus(new Date(nextStartDate), new Date(nextEndDate), nextIsActive)
        }
      },
      { new: true, runValidators: true }
    ).lean()) as unknown as AcademicYearRecord | null;

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "class",
      entity_id: id,
      before: existing,
      after: updated,
      metadata: { scope: "academic_year" }
    });

    return updated ? toAcademicYearResponse(updated as AcademicYearRecord & { created_at?: Date; updated_at?: Date }) : updated;
  });
}

export async function deleteAcademicYear(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "delete");

    const existing = (await AcademicYearModel.findOne(tenantFilter(ctx, { _id: id })).lean()) as unknown as AcademicYearRecord | null;
    if (!existing) {
      throw new Error("Academic year not found.");
    }

    await AcademicYearModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "school",
      entity_id: id,
      before: existing,
      metadata: { scope: "academic_year" }
    });

    return { success: true, id };
  });
}
