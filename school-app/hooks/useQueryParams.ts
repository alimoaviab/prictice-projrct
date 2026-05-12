"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type QueryValue = string | number | boolean | null | undefined;

function shouldClear(value: QueryValue) {
  return value === null || value === undefined || value === "" || value === "all";
}

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const updateQuery = (updates: Record<string, QueryValue>) => {
    const next = new URLSearchParams(currentParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (shouldClear(value)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const withQuery = (basePath: string, extra: Record<string, QueryValue> = {}) => {
    const next = new URLSearchParams(currentParams.toString());

    Object.entries(extra).forEach(([key, value]) => {
      if (shouldClear(value)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    const query = next.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return { currentParams, updateQuery, withQuery, pathname };
}