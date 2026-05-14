import { useEffect, useState } from "react";

/**
 * Mirrors old-app/components/ui/NetworkStatus. Renders a small sticky banner
 * when the browser goes offline so the user knows pending requests will fail.
 */
export function NetworkStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 shadow-lg">
      <span className="material-symbols-outlined text-base">wifi_off</span>
      You're offline. Changes will sync when you reconnect.
    </div>
  );
}
