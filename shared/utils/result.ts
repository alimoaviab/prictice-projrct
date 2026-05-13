import { ZodError } from "zod";
import { ControlledError, ServiceResult } from "../types/core";
import { formatErrorMessage } from "./error-messages";

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
      const friendly = formatErrorMessage(error, "Some of the information you entered is missing or invalid.");
      return fail("VALIDATION_ERROR", friendly, 400, error?.issues ?? error);
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
    if (
      error instanceof ControlledError ||
      error?.name === "ControlledError" ||
      (error?.code && typeof error?.status === "number")
    ) {
      const code = error.code ?? error?.errorCode ?? "ERROR";
      const status = error.status ?? 400;
      // Keep the controlled error's message verbatim (already curated by us)
      // unless it's clearly raw (Mongo/JWT pass-through). Run through
      // formatter for safety.
      const friendly = formatErrorMessage(error, error.message ?? "An error occurred.");
      return fail(code, friendly, status, error.details ?? error?.details);
    }

    // Unknown errors → run through formatter (handles Mongo / network / etc).
    const friendly = formatErrorMessage(error, "The request could not be completed. Please try again.");
    return fail("INTERNAL_ERROR", friendly, error?.status ?? 500);
  }
}
