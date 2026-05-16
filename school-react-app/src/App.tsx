import { useEffect } from "react";
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        
        // Don't intercept Enter on textareas (where it's for newlines) or buttons (where it's for click)
        if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
        
        const focusableElements = 'input:not([type="hidden"]), select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
        const elements = Array.from(document.querySelectorAll<HTMLElement>(focusableElements))
          .filter(el => !el.hasAttribute('disabled') && (el as any).type !== 'hidden' && el.offsetParent !== null); // Only visible & enabled

        const index = elements.indexOf(target);
        if (index > -1 && index < elements.length - 1) {
          e.preventDefault();
          elements[index + 1].focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <QueryProvider>
      <Outlet />
      <ToastProvider />
      <NetworkStatus />
    </QueryProvider>
  );
}
