"use client";

import { useEffect } from "react";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console so it's visible in DevTools
    console.error("[GlobalRouteError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-red-600">error</span>
        </div>
        <h2 className="text-base font-bold text-slate-900">Something went wrong</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          The page encountered an unexpected error. You can retry or go back to the dashboard.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <pre className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] text-left text-slate-700 overflow-auto max-h-48">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ""}
          </pre>
        )}
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="h-9 px-4 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/auth/login")}
            className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-50"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
