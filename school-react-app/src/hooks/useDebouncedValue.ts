import { useEffect, useState } from "react";

/**
 * Returns a value that updates only after `delay` ms have passed without
 * further changes. Used for search inputs.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
