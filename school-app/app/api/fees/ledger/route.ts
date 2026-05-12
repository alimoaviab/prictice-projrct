import { getRequestContext, handleApiResponse } from "@/lib/api-utils";
import { getFeeLedgerDashboard } from "@edu/shared/services/fee-flow.service";

export async function GET(req: Request) {
    const ctx = getRequestContext(req);
    const { searchParams } = new URL(req.url);
    
    const filters = {
        status: searchParams.get("status") || "all",
        class_id: searchParams.get("class_id") || undefined,
        month: searchParams.get("month") || undefined,
        year: searchParams.get("year") || undefined,
        search: searchParams.get("search") || undefined,
        page: searchParams.get("page") || "1",
        limit: searchParams.get("limit") || "20"
    };

    const result = await getFeeLedgerDashboard(ctx, filters);
    return handleApiResponse(result);
}
