/**
 * Tiny module-level pub/sub used to invalidate cached lists across hook
 * instances when one component mutates a domain entity.
 *
 * Why: useSafeAsync state lives per-hook-instance; ClassCreatePage and
 * ClassListPage each get their own copy. Without a notification channel,
 * creating a class in one route doesn't refresh the list rendered by
 * another route or by sibling dropdowns (timetable selector, homework,
 * etc.).
 *
 * This bus is intentionally tiny — no React Query introduction, no API
 * change. Hooks subscribe in a useEffect and re-run their loader when a
 * matching channel is published.
 */

export type DataBusChannel =
  | "classes"
  | "teachers"
  | "students"
  | "subjects"
  | "exams"
  | "results"
  | "events"
  | "homework"
  | "leave"
  | "timetable"
  | "behavior"
  | "attendance"
  | "academic-years"
  | "fees"
  | "live-classes"
  | "tests"
  | "announcements";

type Listener = () => void;

const listeners = new Map<DataBusChannel, Set<Listener>>();

export function publish(channel: DataBusChannel): void {
  const set = listeners.get(channel);
  if (!set || set.size === 0) return;
  // Snapshot before invoking — listeners may unsubscribe during iteration.
  Array.from(set).forEach((fn) => {
    try {
      fn();
    } catch {
      // Swallow listener errors so one broken consumer doesn't poison others.
    }
  });
}

export function subscribe(channel: DataBusChannel, listener: Listener): () => void {
  let set = listeners.get(channel);
  if (!set) {
    set = new Set();
    listeners.set(channel, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
  };
}

/** Convenience for hooks: subscribes for the lifetime of an effect. */
export function bindRefresh(
  channel: DataBusChannel,
  refresh: () => void | Promise<unknown>
): () => void {
  return subscribe(channel, () => {
    void refresh();
  });
}
