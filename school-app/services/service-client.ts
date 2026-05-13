import { ServiceResult } from "@edu/shared/types/core";

/**
 * Generic service client used by every React Query hook in the app.
 *
 * Returns a `ServiceResult<T>` so callers don't need to know about HTTP
 * details: `result.ok` distinguishes success from failure, and the error
 * envelope carries a clean, user-facing message.
 *
 * Network failures (offline, DNS, server unreachable) are normalized to
 * a NETWORK_ERROR result with copy that's safe to show in a toast.
 */
export async function serviceRequest<T>(
    url: string,
    options: RequestInit = {},
    retries = 2
): Promise<ServiceResult<T>> {
    let lastNetworkError: unknown;

    const authHeader =
        typeof window !== "undefined" ? window.localStorage.getItem("token") ?? undefined : undefined;

    if (authHeader && !authHeader.startsWith("eyJ")) {
        console.warn(
            `[ServiceRequest] Invalid token format in localStorage. Token starts with: ${authHeader.substring(0, 20)}. ` +
            `Please clear localStorage and log in again.`
        );
    }

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const response = await fetch(url, {
                ...options,
                credentials: "include",
                headers: {
                    "content-type": "application/json",
                    "x-academic-year-id":
                        typeof window !== "undefined" ? window.localStorage.getItem("academic_year_id") ?? "" : "",
                    ...(authHeader && authHeader.startsWith("eyJ") ? { authorization: `Bearer ${authHeader}` } : {}),
                    ...(options.headers ?? {})
                }
            });

            // Handle non-JSON or empty body gracefully so we never throw an
            // unhelpful "Unexpected end of JSON input" at callers.
            const text = await response.text();
            let payload: any = null;
            if (text) {
                try {
                    payload = JSON.parse(text);
                } catch {
                    payload = null;
                }
            }

            if (response.ok) {
                if (payload && typeof payload === "object" && "ok" in payload) {
                    return payload as ServiceResult<T>;
                }
                return {
                    ok: true,
                    success: true,
                    data: payload as T
                };
            }

            // Build a user-friendly message from the response status when the
            // body doesn't carry one. The backend almost always carries one,
            // but we hedge for opaque failures (e.g. 502 from a proxy).
            const fallbackByStatus =
                response.status === 401
                    ? "Your session has ended. Please sign in again to continue."
                    : response.status === 403
                        ? "You don't have permission to do this."
                        : response.status === 404
                            ? "We couldn't find what you were looking for."
                            : response.status === 409
                                ? "This change conflicts with existing data."
                                : response.status === 429
                                    ? "You're doing that too quickly. Please wait a moment."
                                    : response.status >= 500
                                        ? "The server ran into a problem. Please try again shortly."
                                        : "The request couldn't be completed. Please try again.";

            const message =
                payload?.error?.message ??
                payload?.message ??
                fallbackByStatus;

            const errorEnvelope: ServiceResult<T> = {
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
            };

            return errorEnvelope;
        } catch (error) {
            lastNetworkError = error;
        }
    }

    return {
        ok: false,
        success: false,
        message:
            "Couldn't reach the server. Please check your internet connection and try again.",
        errorCode: "NETWORK_ERROR",
        error: {
            code: "NETWORK_ERROR",
            message:
                "Couldn't reach the server. Please check your internet connection and try again.",
            status: 503,
            details: lastNetworkError
        }
    };
}
