import { ControlledError, ServiceResult } from "../types/core";

export function ok<T>(data: T, meta?: Record<string, unknown>): ServiceResult<T> {
  return { ok: true, data, meta };
}

export function fail<T = never>(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): ServiceResult<T> {
  return { ok: false, error: { code, message, status, details } };
}

export async function serviceTry<T>(operation: () => Promise<T>): Promise<ServiceResult<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    if (error instanceof ControlledError) {
      return fail(error.code, error.message, error.status, error.details);
    }

    return fail("INTERNAL_ERROR", "The request could not be completed.", 500);
  }
}
