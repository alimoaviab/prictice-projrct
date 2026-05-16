/**
 * Wraps every /parent/* page in the SelectedChildProvider.
 *
 * Why this exists: parent route pages call useSelectedChild() at the
 * top of their component (e.g. ParentExamsPage) and only afterwards
 * render <SchoolShell>, which is where the provider used to live.
 * That order means the hook fires before the provider mounts and
 * React throws "useSelectedChild must be used within a
 * SelectedChildProvider".
 *
 * Hoisting the provider to a router-level layout fixes the order
 * permanently — the provider is now an ancestor of every parent page
 * regardless of how the page composes SchoolShell internally.
 */

import { Outlet } from "react-router-dom";
import { SelectedChildProvider } from "@/contexts/SelectedChildContext";

export function ParentLayout() {
  return (
    <SelectedChildProvider>
      <Outlet />
    </SelectedChildProvider>
  );
}
