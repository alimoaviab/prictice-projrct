import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { ClassModel } from "@edu/shared/models/class.model";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const url = new URL(request.url);
        const name = url.searchParams.get("name")?.trim();
        const section = url.searchParams.get("section")?.trim() || "";
        const academicYearId = url.searchParams.get("academic_year_id")?.trim();

        if (!name || !academicYearId) {
            return NextResponse.json(
                fail("VALIDATION_ERROR", "name and academic_year_id are required", 400),
                { status: 400 }
            );
        }

        const filter: Record<string, unknown> = {
            school_id: ctx.school_id,
            name,
            academy_care_id: academicYearId
        };

        if (section) {
            filter.section = section;
        }

        const found: any = await ClassModel.findOne(filter).lean();
        return NextResponse.json(
            { exists: Boolean(found), class_id: found ? String(found._id) : null },
            { status: 200 }
        );
    } catch (error) {
        console.error("[GET /api/school/classes/check] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
