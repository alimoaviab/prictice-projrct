/**
 * Shared API response shape — matches the Go backend's ServiceResult contract
 * exactly, so the same response can be consumed by web and mobile clients.
 */

export interface ApiError {
  code?: string;
  message?: string;
  status?: number;
  details?: unknown;
}

export interface ServiceResult<T = unknown> {
  ok: boolean;
  success?: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
  error?: ApiError;
}

/** Standard pagination envelope used by every list endpoint on the server. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
