import { showToast } from "./toast";

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export function handleError(
  error: unknown,
  fallbackMessage = "Something went wrong"
): AppError {
  console.error("[Global Error Handler]:", error);

  const e = error as Record<string, unknown> | null;
  const errorObj = (e?.error as Record<string, unknown> | undefined) ?? undefined;
  const message =
    (e?.message as string | undefined) ??
    (errorObj?.message as string | undefined) ??
    fallbackMessage;

  showToast(message, "error");

  return {
    message,
    code: (e?.code as string | undefined) ?? (e?.errorCode as string | undefined),
    status:
      (e?.status as number | undefined) ??
      (errorObj?.status as number | undefined),
    details:
      (e?.details as unknown) ?? (errorObj?.details as unknown) ?? undefined,
  };
}
