"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: 440,
            width: "100%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 24,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              margin: "0 auto 12px",
              height: 48,
              width: 48,
              borderRadius: "50%",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ⚠️
          </div>
          <h2 style={{ margin: "8px 0 4px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            Application Error
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
            The application failed to load. Please refresh or return to login.
          </p>
          {process.env.NODE_ENV === "development" && error?.message && (
            <pre
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 10,
                fontSize: 10,
                textAlign: "left",
                color: "#334155",
                overflow: "auto",
                maxHeight: 160,
                marginBottom: 16,
              }}
            >
              {error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 8,
                background: "#2563eb",
                color: "white",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/auth/login")}
              style={{
                height: 36,
                padding: "0 16px",
                borderRadius: 8,
                background: "white",
                color: "#334155",
                border: "1px solid #e2e8f0",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
