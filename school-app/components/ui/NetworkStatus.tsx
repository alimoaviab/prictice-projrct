"use client";

import { useEffect, useState } from "react";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    setIsOnline(navigator.onLine);
    setShowBanner(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
        isOnline
          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-amber-50 border border-amber-200 text-amber-700"
      }`}
    >
      <span className="material-symbols-outlined text-xl">
        {isOnline ? "wifi" : "wifi_off"}
      </span>
      <span className="text-sm font-medium">
        {isOnline ? "Connection restored" : "You are offline. Some features may not work."}
      </span>
    </div>
  );
}
