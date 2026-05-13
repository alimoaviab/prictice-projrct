import { ServiceResult } from "@edu/shared/types/core";

/**
 * Centralized API client for the school app.
 *
 * Responsibilities:
 * - Always send the JWT (Bearer) and session cookie together so one failure
 *   doesn't silently down-grade into an unauthenticated call.
 * - Attach the academic-year header the backend expects.
 * - Convert any failure (network, 4xx, 5xx, malformed JSON) into a
 *   typed ServiceResult so the UI can never crash on `undefined` fields.
 * - On 401 responses, clear the stale token in localStorage and redirect
 *   to /auth/login instead of letting the caller render broken state.
 */

function readToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem("token");
  if (!raw) return undefined;
  const trimmed = raw.trim();
  // Only accept syntactically valid JWTs to avoid "Bearer undefined" chaos.
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

  // Avoid redirect loops: already on login? do nothing.
  const path = window.location?.pathname || "";
  if (path.startsWith("/auth/")) return;

  // Use replace so back button can't land on the broken state.
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
          ...(options.headers ?? {})
        }
      });

      // Handle body parsing safely
      const text = await response.text();
      let payload: any = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = null;
        }
      }

      // 401/403 → auth failure: clear token and redirect.
      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        const message = payload?.message || "Your session has ended. Please sign in again to continue.";
        return {
          ok: false,
          success: false,
          message,
          error: {
            code: payload?.error?.code || "UNAUTHORIZED",
            message,
            status: response.status
          }
        } as ServiceResult<T>;
      }

      if (response.ok) {
        // If the server explicitly said ok in the body, return it as is
        if (payload && typeof payload === "object" && "ok" in payload) {
          return payload as ServiceResult<T>;
        }
        // Otherwise wrap the raw data
        return {
          ok: true,
          success: true,
          data: payload as T
        };
      }

      // Build a user-friendly message from the response status when the
      // body doesn't carry one.
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

      const message = payload?.error?.message ?? payload?.message ?? fallbackByStatus;

      return {
        ok: false,
        success: false,
        message,
        errorCode: payload?.error?.code ?? payload?.errorCode ?? `HTTP_${response.status}`,
        error: {
          code: payload?.error?.code ?? `HTTP_${response.status}`,
          message,
          status: response.status,
          details: payload
        }
      } as ServiceResult<T>;

    } catch (error) {
      lastError = error;
      // Continue to next retry attempt for network errors
    }
  }

  // Final fallback for network failures
  return {
    ok: false,
    success: false,
    message: "Couldn't reach the server. Please check your internet connection and try again.",
    error: {
      code: "NETWORK_ERROR",
      message: "Couldn't reach the server. Please check your internet connection and try again.",
      status: 503,
      details: lastError
    }
  } as ServiceResult<T>;
}

/**
 * Convenience helper for callers that expect a plain `{ ok, data }` payload.
 * Always resolves — never throws — so the UI stays safe.
 */
export async function apiFetch<T = any>(
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
    status: (result as any).error?.status
  };
}
