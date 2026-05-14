/**
 * Ported 1:1 from old-app/school-app/hooks/useSafeAsync.ts.
 * Same `AsyncState<T>` union, same `state.status` values — module pages
 * depend on this contract.
 */

import { useCallback, useState } from "react";
import type { AsyncState } from "@/types/core";

const defaultIsEmpty = <T,>(value: T) =>
  Array.isArray(value) && value.length === 0;

export type { AsyncState };

export function useSafeAsync<T>(
  isEmpty: (value: T) => boolean = defaultIsEmpty
) {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  const run = useCallback(
    async (operation: () => Promise<T>) => {
      setState((previous) => ({ status: "loading", data: previous.data }));
      try {
        const data = await operation();
        setState({ status: isEmpty(data) ? "empty" : "success", data });
        return data;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The request failed.";
        setState((previous) => ({
          status: "error",
          data: previous.data,
          error: message,
        }));
        throw error;
      }
    },
    [isEmpty]
  );

  return { state, run };
}
