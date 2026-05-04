import { ServiceResult } from "@edu/shared/types/core";

export async function serviceRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<ServiceResult<T>> {
  let lastError: unknown;

  const authHeader =
    typeof window !== "undefined" ? window.localStorage.getItem("token") ?? undefined : undefined;

  // Validate token format on client side
  if (authHeader && !authHeader.startsWith("eyJ")) {
    console.warn(
      `[ServiceRequest] Invalid token format in localStorage. Token starts with: ${authHeader.substring(0, 20)}. ` +
      `Please clear localStorage and log in again.`
    );
    // Don't send malformed token, let it fall back to cookies
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "content-type": "application/json",
          // Only send Bearer token if it's a valid JWT
          ...(authHeader && authHeader.startsWith("eyJ") ? { authorization: `Bearer ${authHeader}` } : {}),
          ...(options.headers ?? {})
        }
      });

      const payload = (await response.json()) as ServiceResult<T>;
      if (response.ok || !payload.success) {
        return payload;
      }
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    success: false,
    message: "The request could not be completed. Check your connection and retry.",
    errorCode: "NETWORK_ERROR",
    error: {
      code: "NETWORK_ERROR",
      message: "The request could not be completed. Check your connection and retry.",
      status: 503,
      details: lastError
    }
  };
}
