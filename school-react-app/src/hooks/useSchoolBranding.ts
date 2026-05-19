/**
 * useSchoolBranding — small read-only hook for the chrome (sidebar
 * footer card, header brand, etc.) that needs the school's display
 * name + logo without dragging in the full settings form.
 *
 * Backend already caches GET /api/settings in Redis for 30 min, so
 * this hook is cheap to call from layout components on every nav.
 */

import { useQuery } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "./useTenantContext";

export interface SchoolBranding {
    schoolName: string;
    logoUrl: string;
}

export function useSchoolBranding() {
    const { schoolId } = useTenantContext();

    const query = useQuery<SchoolBranding>({
        queryKey: ["settings", "branding", schoolId],
        queryFn: async () => {
            const result = await serviceRequest<any>("/api/settings");
            if (!result.success) {
                throw new Error(result.message || "Failed to load branding");
            }
            const data = result.data as any;
            const profile = data?.profile ?? data ?? {};
            return {
                schoolName:
                    profile?.schoolName ||
                    profile?.school_name ||
                    data?.schoolName ||
                    data?.school_name ||
                    "",
                logoUrl: data?.branding?.logoUrl || data?.branding?.logo_url || "",
            };
        },
        // Branding is rarely changed; cache aggressively to keep the
        // sidebar card from flickering on every route change.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        enabled: !!schoolId,
    });

    return {
        schoolName: query.data?.schoolName || "",
        logoUrl: query.data?.logoUrl || "",
        isLoading: query.isLoading,
    };
}
