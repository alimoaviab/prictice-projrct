import { SchoolShell } from "@/layouts/SchoolShell";
import EventListPage from "@/modules/events/components/EventListPage";
import { useSelectedChild } from "@/contexts/SelectedChildContext";

/**
 * Parent events portal — scoped to the selected child's class.
 *
 * The backend's `for_class_id` filter is "loose": it returns events
 * targeted at the child's class AND school-wide events that target
 * everyone. That's the correct mental model for a parent — they want
 * "Sports Day" plus "Class 10 Field Trip", not "Class 5 Trip".
 */
export function ParentEventsPage() {
  const { selectedChild } = useSelectedChild();
  const filters = selectedChild?.class_id ? { forClassId: selectedChild.class_id } : undefined;

  return (
    <SchoolShell eyebrow="Parent Dashboard" title="School Events">
      <EventListPage filters={filters} />
    </SchoolShell>
  );
}
