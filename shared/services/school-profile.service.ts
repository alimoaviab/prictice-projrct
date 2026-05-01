import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { SchoolModel } from "../models/school.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { SchoolSettingsInput, schoolSettingsSchema } from "../validation/school.schema";
import { writeAuditLog } from "./audit.service";

type SchoolProfileDoc = {
  school_id: string;
  name?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  logo_url?: string;
  established_year?: number;
  admin_profile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

function mapSchoolProfile(school: Record<string, any>) {
  return {
    academy_name: school.name ?? "",
    academy_phone: school.contact_phone ?? "",
    academy_email: school.contact_email ?? "",
    academy_address: school.address ?? "",
    logo_url: school.logo_url ?? "",
    principal_name: school.admin_profile?.name ?? "",
    principal_email: school.admin_profile?.email ?? "",
    principal_phone: school.admin_profile?.phone ?? "",
    established_year: school.established_year ? String(school.established_year) : ""
  };
}

export async function getSchoolProfile(ctx: RequestContext): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "view");

    const school = (await SchoolModel.findOne(tenantFilter(ctx)).lean()) as unknown as SchoolProfileDoc | null;
    if (!school) {
      throw new Error("School profile not found.");
    }

    return mapSchoolProfile(school);
  });
}

export async function updateSchoolProfile(
  ctx: RequestContext,
  input: SchoolSettingsInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "settings", "update");

    const parsed = schoolSettingsSchema.parse(input);
    const before = (await SchoolModel.findOne(tenantFilter(ctx)).lean()) as unknown as SchoolProfileDoc | null;
    if (!before) {
      throw new Error("School profile not found.");
    }

    const updated = (await SchoolModel.findOneAndUpdate(
      tenantFilter(ctx),
      {
        $set: {
          ...(parsed.academy_name !== undefined ? { name: parsed.academy_name } : {}),
          ...(parsed.academy_phone !== undefined ? { contact_phone: parsed.academy_phone } : {}),
          ...(parsed.academy_email !== undefined ? { contact_email: parsed.academy_email } : {}),
          ...(parsed.academy_address !== undefined ? { address: parsed.academy_address } : {}),
          ...(parsed.logo_url !== undefined ? { logo_url: parsed.logo_url } : {}),
          ...(parsed.established_year !== undefined
            ? { established_year: parsed.established_year ? Number(parsed.established_year) : undefined }
            : {}),
          ...(parsed.principal_name !== undefined ||
            parsed.principal_email !== undefined ||
            parsed.principal_phone !== undefined
            ? {
              admin_profile: {
                name: parsed.principal_name ?? before.admin_profile?.name ?? "",
                email: parsed.principal_email ?? before.admin_profile?.email ?? "",
                phone: parsed.principal_phone ?? before.admin_profile?.phone ?? ""
              }
            }
            : {})
        }
      },
      { new: true, runValidators: true }
    ).lean()) as unknown as SchoolProfileDoc | null;

    if (!updated) {
      throw new Error("School profile not found.");
    }

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "school",
      entity_id: before.school_id,
      before,
      after: updated
    });

    return mapSchoolProfile(updated);
  });
}
