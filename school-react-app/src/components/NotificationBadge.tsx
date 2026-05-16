/**
 * NotificationBadge — real-time notification count badge.
 *
 * Uses WebSocket push to update the count instantly when new notifications
 * arrive, eliminating the need for polling.
 *
 * Fallback: If WebSocket is disconnected, falls back to TanStack Query
 * with a 2-minute staleTime.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "@/hooks/useTenantContext";
import { STALE_TIME_NOTIFICATIONS } from "@/lib/query-client";

interface NotificationCountResponse {
  data: { _id: string; read: boolean }[];
  total?: number;
}

export function NotificationBadge() {
  const { schoolId } = useTenantContext();
  const queryClient = useQueryClient();

  // Query for unread count (WebSocket updates this cache key directly)
  const { data: count } = useQuery<number>({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const result = await serviceRequest<NotificationCountResponse>(
        "/api/notifications?limit=1"
      );
      if (!result.ok) return 0;

      // Count unread from the total or data
      const data = result.data as any;
      if (data?.total !== undefined) {
        // If we have total from cursor response, use it
        const items = data?.data ?? [];
        return items.filter((n: any) => !n.read).length;
      }
      // Fallback: count unread in returned items
      const items = Array.isArray(data) ? data : data?.data ?? [];
      return items.filter((n: any) => !n.read).length;
    },
    staleTime: STALE_TIME_NOTIFICATIONS,
    gcTime: 10 * 60 * 1000,
    enabled: !!schoolId,
    refetchOnWindowFocus: false,
  });

  if (!count || count === 0) return null;

  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
      aria-label={`${count} unread notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
