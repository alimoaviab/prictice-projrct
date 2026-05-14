import { Outlet } from "react-router-dom";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Top-level app shell. Identical responsibility to old-app/school-app/app/layout.tsx:
 * mount global providers (TanStack Query, toast bus, network indicator), then
 * render the active route via React Router's <Outlet />.
 */
export function App() {
  return (
    <QueryProvider>
      <Outlet />
      <ToastProvider />
      <NetworkStatus />
    </QueryProvider>
  );
}
