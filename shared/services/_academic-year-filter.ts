import { Types } from "mongoose";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { ClassModel } from "../models/class.model";
import { RequestContext } from "../types/core";

export async function resolveAcademicYearId(
    ctx: RequestContext,
    academicYearId?: string
): Promise<string | undefined> {
    if (academicYearId) {
        return academicYearId;
    }

    const active = (await AcademicYearModel.findOne(
        tenantFilter(ctx, { is_active: true })
    )
        .select("_id")
        .lean()) as { _id?: unknown } | null;

    return active?._id ? String(active._id) : undefined;
}

export async function resolveClassIdsForAcademicYear(
    ctx: RequestContext,
    academicYearId?: string
): Promise<Types.ObjectId[]> {
    const resolvedAcademicYearId = await resolveAcademicYearId(ctx, academicYearId);
    if (!resolvedAcademicYearId) {
        return [];
    }

    const classes = await ClassModel.find(
        tenantFilter(ctx, { academic_year_id: new Types.ObjectId(resolvedAcademicYearId) })
    )
        .select("_id")
        .lean();

    return classes.map((row) => new Types.ObjectId(String(row._id)));
}
