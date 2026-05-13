"use client";

import { useCallback, useState } from "react";

export type AsyncState<T> =
  | { status: "idle"; data?: undefined; error?: undefined }
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "success"; data: T; error?: undefined }
  | { status: "empty"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: string };

const defaultIsEmpty = (value: any) => Array.isArray(value) && value.length === 0;

export function useSafeAsync<T>(isEmpty: (value: T) => boolean = defaultIsEmpty) {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  const run = useCallback(
    async (operation: () => Promise<T>) => {
      setState((previous) => ({ status: "loading", data: previous.data }));
      try {
        const data = await operation();
        setState({ status: isEmpty(data) ? "empty" : "success", data });
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : "The request failed.";
        setState((previous) => ({ status: "error", data: previous.data, error: message }));
        throw error;
      }
    },
    [isEmpty]
  );

  return { state, run };
}
