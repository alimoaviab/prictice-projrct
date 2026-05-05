import { ZodError } from "zod";
import { ControlledError, ServiceResult } from "../types/core";

export function ok<T>(data: T, meta?: Record<string, unknown>, message?: string): ServiceResult<T> {
  return { ok: true, success: true, data, meta, message };
}

export function fail<T = never>(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): ServiceResult<T> {
  return {
    ok: false,
    success: false,
    message,
    errorCode: code,
    error: { code, message, status, details }
  };
}

export async function serviceTry<T>(operation: () => Promise<T>): Promise<ServiceResult<T>> {
  try {
    return ok(await operation());
  } catch (error: any) {
    if (error instanceof ZodError || error?.name === "ZodError" || Array.isArray(error?.issues)) {
      const firstIssueMessage = error?.issues?.[0]?.message ?? error?.message ?? "Validation failed.";

      return fail("VALIDATION_ERROR", firstIssueMessage, 400, error?.issues ?? error);
    }

    console.error("[serviceTry] Caught error:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack,
      type: error?.constructor?.name
    });

    // Some runtime bundlers can cause instanceof checks to fail when
    // the error class is re-imported across module boundaries. Detect
    // ControlledError by `name` and shape as a fallback.
    if (error instanceof ControlledError || error?.name === "ControlledError" || (error?.code && typeof error?.status === "number")) {
      return fail(error.code ?? error?.errorCode ?? "ERROR", error.message ?? error?.message ?? "An error occurred", error.status ?? 400, error.details ?? error?.details);
    }

    // Log the full error for debugging
    console.error("[serviceTry] Full error object:", error);

    return fail("INTERNAL_ERROR", error?.message || "The request could not be completed.", 500);
  }
}
