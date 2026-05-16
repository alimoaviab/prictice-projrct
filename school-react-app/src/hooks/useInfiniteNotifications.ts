/**
 * useInfiniteNotifications — cursor-based infinite scroll for notifications.
 *
 * Uses TanStack Query's useInfiniteQuery with IntersectionObserver for
 * automatic loading when the user scrolls to the bottom.
 *
 * Backend contract:
 *   GET /api/notifications?limit=20&cursor=<base64_timestamp>
 *   Response: { data: [...], next_cursor: "...", has_more: true, total: 42 }
 */

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { serviceRequest } from "@/services/service-client";
import { useTenantContext } from "./useTenantContext";

interface NotificationItem {
  _id: string;
  school_id: string;
  user_id: string;
  title: string;
  body?: string;
  category?: string;
  read: boolean;
  created_at: string;
}

interface NotificationPage {
  data: NotificationItem[];
  next_cursor?: string;
  has_more: boolean;
  total?: number;
}

interface UseInfiniteNotificationsOptions {
  limit?: number;
  enabled?: boolean;
}

export function useInfiniteNotifications(
  opts: UseInfiniteNotificationsOptions = {}
) {
  const { schoolId } = useTenantContext();
  const limit = opts.limit ?? 20;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery<NotificationPage>({
    queryKey: ["notifications", schoolId, limit],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (pageParam) {
        params.set("cursor", pageParam as string);
      }

      const result = await serviceRequest<NotificationPage>(
        `/api/notifications?${params.toString()}`
      );

      if (!result.ok) {
        throw new Error(
          result.error?.message || "Failed to load notifications"
        );
      }

      // The backend wraps in ServiceResult.data
      const page = result.data as unknown as NotificationPage;
      return page;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more && lastPage.next_cursor) {
        return lastPage.next_cursor;
      }
      return undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: (opts.enabled ?? true) && !!schoolId,
  });

  // Flatten all pages into a single array
  const notifications: NotificationItem[] =
    query.data?.pages.flatMap((page) => page.data) ?? [];

  const total = query.data?.pages[0]?.total ?? 0;

  // IntersectionObserver for infinite scroll
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (query.isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && query.hasNextPage) {
            void query.fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );

      if (node) {
        observerRef.current.observe(node);
      }

      loadMoreRef.current = node;
    },
    [query.isFetchingNextPage, query.hasNextPage, query.fetchNextPage]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    notifications,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Ref to attach to the "load more" sentinel element
    lastElementRef,
  };
}
