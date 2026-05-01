import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { RequestContext, ServiceResult } from "../types/core";
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
    return (await AcademicYearModel.find(tenantFilter(ctx)).sort({ start_date: -1 }).lean()) as unknown as AcademicYearRecord[];
  });
}

export async function createAcademicYear(
  ctx: RequestContext,
  input: AcademicYearCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "create");

    const parsed = academicYearCreateSchema.parse(input);
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

    return created.toObject();
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

    const parsed = academicYearUpdateSchema.parse(input);
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

    return updated;
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
