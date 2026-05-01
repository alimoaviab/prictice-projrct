import { Types } from "mongoose";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { ClassModel } from "../models/class.model";
import { RequestContext } from "../types/core";

export async function resolveAcademyCareId(
    ctx: RequestContext,
    academyCareId?: string
): Promise<string | undefined> {
    if (academyCareId) {
        return academyCareId;
    }

    const active = (await AcademicYearModel.findOne(
        tenantFilter(ctx, { is_active: true })
    )
        .select("_id")
        .lean()) as { _id?: unknown } | null;

    return active?._id ? String(active._id) : undefined;
}

export async function resolveClassIdsForAcademyCare(
    ctx: RequestContext,
    academyCareId?: string
): Promise<Types.ObjectId[]> {
    const resolvedAcademyCareId = await resolveAcademyCareId(ctx, academyCareId);
    if (!resolvedAcademyCareId) {
        return [];
    }

    const classes = await ClassModel.find(
        tenantFilter(ctx, { academy_care_id: new Types.ObjectId(resolvedAcademyCareId) })
    )
        .select("_id")
        .lean();

    return classes.map((row) => new Types.ObjectId(String(row._id)));
}
