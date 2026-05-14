/**
 * useDebounce — debounces a callback function.
 *
 * Unlike useDebouncedValue (which debounces a value), this debounces the
 * execution of a function. Useful for:
 *   - Search input → API call (300ms)
 *   - Filter changes → refetch (200ms)
 *   - Attendance toggles → batch submit (500ms)
 *
 * The returned function can be called multiple times; only the last
 * invocation within the delay window will execute.
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebounce((term: string) => {
 *   fetchStudents({ search: term });
 * }, 300);
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */

import { useCallback, useEffect, useRef } from "react";

/**
 * Debounces a callback function. The callback is only invoked after `delay`
 * milliseconds have passed since the last call.
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function + cancel/flush utilities
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): DebouncedFunction<T> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  // Always use the latest callback without resetting the timer
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as DebouncedFunction<T>;

  // Cancel pending execution
  debouncedFn.cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  // Execute immediately (flush pending)
  debouncedFn.flush = useCallback(() => {
    if (timerRef.current && lastArgsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  // Check if there's a pending execution
  debouncedFn.isPending = useCallback(() => {
    return timerRef.current !== null;
  }, []);

  return debouncedFn;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
}

// ─── Convenience: Debounced value with callback ──────────────────────────

/**
 * useDebouncedCallback — fires a callback when a value stops changing.
 *
 * Combines value watching with debounced execution. Useful for search inputs
 * where you want to fire an API call after the user stops typing.
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState("");
 * useDebouncedCallback(search, 300, (term) => {
 *   refetch({ search: term });
 * });
 * ```
 */
export function useDebouncedCallback<T>(
  value: T,
  delay: number,
  callback: (value: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const timer = setTimeout(() => {
      callbackRef.current(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
}
