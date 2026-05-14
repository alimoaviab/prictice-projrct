/**
 * URL query-param helper. Mirrors the API of the original
 * old-app/school-app/hooks/useQueryParams.ts but uses react-router-dom
 * instead of next/navigation.
 *
 * Provides:
 *   - currentParams: URLSearchParams of the active URL
 *   - updateQuery({ key: value }): merges values, navigates without page reload
 *   - withQuery(path): copies the current query string onto another path
 */

import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type QueryUpdate = Record<string, string | undefined | null>;

export function useQueryParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const updateQuery = useCallback(
    (next: QueryUpdate, options: { replace?: boolean } = {}) => {
      const params = new URLSearchParams(location.search);
      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      const search = params.toString();
      const url = `${location.pathname}${search ? `?${search}` : ""}`;
      navigate(url, { replace: options.replace ?? true });
    },
    [location.pathname, location.search, navigate]
  );

  const withQuery = useCallback(
    (path: string) => {
      const search = location.search;
      if (!search) return path;
      const sep = path.includes("?") ? "&" : "?";
      return `${path}${sep}${search.replace(/^\?/, "")}`;
    },
    [location.search]
  );

  return { currentParams, updateQuery, withQuery };
}
