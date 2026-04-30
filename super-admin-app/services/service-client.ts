import { ServiceResult } from "@edu/shared/types/core";

export async function serviceRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<ServiceResult<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "content-type": "application/json",
          ...(options.headers ?? {})
        }
      });
      return (await response.json()) as ServiceResult<T>;
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    error: {
      code: "NETWORK_ERROR",
      message: "The request could not be completed. Check your connection and retry.",
      status: 503,
      details: lastError
    }
  };
}
