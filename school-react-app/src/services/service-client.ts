/**
 * Centralised API client for the school app. Ported from
 * old-app/school-app/services/service-client.ts.
 *
 * Responsibilities:
 *   - Always send the JWT (Bearer) and session cookie together so one failure
 *     does not silently down-grade into an unauthenticated call.
 *   - Attach the academic-year header the backend expects.
 *   - Convert any failure (network, 4xx, 5xx, malformed JSON) into a typed
 *     ServiceResult so the UI can never crash on `undefined` fields.
 *   - On 401 responses, clear the stale token and redirect to /auth/login.
 *
 * URL behaviour:
 *   - Relative paths (e.g. "/api/students") are sent as-is. In dev, Vite
 *     either proxies them to the Go backend (when VITE_API_PROXY_TARGET is
 *     set) or MSW intercepts them and serves mock data.
 *   - Absolute URLs are honoured untouched.
 */

import type { ServiceResult } from "@/types/core";

function readToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem("token");
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.startsWith("eyJ") ? trimmed : undefined;
}

function readAcademicYearId(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("academic_year_id") ?? "";
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("profile_id");
    window.localStorage.removeItem("class_id");
    window.localStorage.removeItem("student_id");
  } catch {
    // ignore
  }

  const path = window.location?.pathname || "";
  if (path.startsWith("/auth/")) return;

  window.location.replace("/auth/login");
}

export async function serviceRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = 1
): Promise<ServiceResult<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const token = readToken();
      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-academic-year-id": readAcademicYearId(),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });

      const text = await response.text();
      let payload: unknown = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }
      }

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        const p = payload as Record<string, unknown> | null;
        const message =
          (p?.message as string | undefined) ||
          "Your session has ended. Please sign in again to continue.";
        return {
          ok: false,
          success: false,
          message,
          error: {
            code:
              ((p?.error as Record<string, unknown> | undefined)?.code as string | undefined) ||
              "UNAUTHORIZED",
            message,
            status: response.status,
          },
        };
      }

      if (response.ok) {
        if (payload && typeof payload === "object" && "ok" in (payload as object)) {
          return payload as ServiceResult<T>;
        }
        return {
          ok: true,
          success: true,
          data: payload as T,
        };
      }

      const fallbackByStatus =
        response.status === 404
          ? "We couldn't find what you were looking for."
          : response.status === 409
            ? "This change conflicts with existing data."
            : response.status === 429
              ? "You're doing that too quickly. Please wait a moment."
              : response.status >= 500
                ? "The server ran into a problem. Please try again shortly."
                : "The request couldn't be completed. Please try again.";

      const p = payload as Record<string, unknown> | null;
      const errorObj = p?.error as Record<string, unknown> | undefined;
      const message =
        (errorObj?.message as string | undefined) ??
        (p?.message as string | undefined) ??
        fallbackByStatus;

      return {
        ok: false,
        success: false,
        message,
        errorCode:
          (errorObj?.code as string | undefined) ??
          (p?.errorCode as string | undefined) ??
          `HTTP_${response.status}`,
        error: {
          code: (errorObj?.code as string | undefined) ?? `HTTP_${response.status}`,
          message,
          status: response.status,
          details: payload,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    success: false,
    message:
      "Couldn't reach the server. Please check your internet connection and try again.",
    error: {
      code: "NETWORK_ERROR",
      message:
        "Couldn't reach the server. Please check your internet connection and try again.",
      status: 503,
      details: lastError,
    },
  };
}

/**
 * Convenience helper for callers that expect a plain `{ ok, data }` payload.
 * Always resolves — never throws — so the UI stays safe.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; data?: T; message?: string; status?: number }> {
  const result = await serviceRequest<T>(url, options);
  if (result.ok) {
    return { ok: true, data: result.data, message: result.message };
  }
  return {
    ok: false,
    message: result.message,
    status: result.error?.status,
  };
}
