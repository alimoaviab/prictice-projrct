"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight connection-status banner. Stays out of the way unless the
 * browser reports the device as offline; reappears briefly with a
 * confirmation when the connection comes back so the user knows it's safe
 * to keep working.
 */
export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowBanner(true);
            const t = setTimeout(() => setShowBanner(false), 3500);
            return () => clearTimeout(t);
        };
        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        if (typeof navigator !== "undefined") {
            setIsOnline(navigator.onLine);
            setShowBanner(!navigator.onLine);
        }

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
            role="status"
            aria-live="polite"
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 max-w-[calc(100vw-2rem)] ${
                isOnline
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border border-amber-200 text-amber-700"
            }`}
        >
            <span className="material-symbols-outlined text-xl flex-shrink-0">
                {isOnline ? "wifi" : "wifi_off"}
            </span>
            <span className="text-sm font-medium leading-snug">
                {isOnline
                    ? "Back online. Your changes will sync now."
                    : "You're offline. Recent actions will retry once your connection returns."}
            </span>
        </div>
    );
}
