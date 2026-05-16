/**
 * Centralised HTTP client.
 *
 * Behaviour mirrors school-react-app/src/services/service-client.ts so the
 * Go backend treats web and mobile traffic identically:
 *   • Always sends Bearer JWT and the X-Academic-Year-Id header.
 *   • Returns ServiceResult<T> — never throws — so screens can never crash
 *     on undefined response fields.
 *   • On 401, clears the token and emits an event for the auth store to
 *     redirect to /login.
 */

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

import { env } from '@/config/env';
import type { ServiceResult } from '@/types/api';
import { secureStorage, prefStorage, StorageKeys } from '@/utils/secure-storage';

// Lightweight pub/sub — the auth store subscribes to this so it can react
// to forced logouts without importing the store directly (avoids a cycle).
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export const onUnauthorized = (listener: Listener): (() => void) => {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
};

const emitUnauthorized = () => {
  unauthorizedListeners.forEach((l) => {
    try {
      l();
    } catch {
      // ignore listener errors
    }
  });
};

// ────────────────────────────────────────────────────────────────────────
// Axios instance
// ────────────────────────────────────────────────────────────────────────

export const http: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20_000,
  // RN doesn't support credentials: 'include' the same way browsers do, but
  // axios still ships cookies for hosts that set them.
  withCredentials: true,
});

http.interceptors.request.use(async (config) => {
  const [token, academicYearId] = await Promise.all([
    secureStorage.get(StorageKeys.token),
    prefStorage.get(StorageKeys.academicYearId),
  ]);

  config.headers = config.headers ?? {};
  config.headers['Content-Type'] = config.headers['Content-Type'] ?? 'application/json';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (academicYearId) {
    config.headers['X-Academic-Year-Id'] = academicYearId;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Wipe sensitive state and notify subscribers (auth store will route
      // the user to the login screen).
      await secureStorage.remove(StorageKeys.token);
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

// ────────────────────────────────────────────────────────────────────────
// Public request helpers — every call returns ServiceResult, never throws.
// ────────────────────────────────────────────────────────────────────────

interface RequestOptions<TBody = unknown> {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: TBody;
  signal?: AbortSignal;
  /** Treat the response body as the data directly when the server doesn't
   *  wrap it in `{ ok, data }`. Most modern endpoints DO wrap, so this is
   *  rarely needed. */
  unwrap?: boolean;
}

function buildQuery(params?: RequestOptions['query']): string {
  if (!params) return '';
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return pairs.length ? `?${pairs.join('&')}` : '';
}

function fallbackForStatus(status: number): string {
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status === 409) return 'This change conflicts with existing data.';
  if (status === 429) return "You're doing that too quickly. Please wait a moment.";
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return "The request couldn't be completed. Please try again.";
}

async function request<TData, TBody = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  options: RequestOptions<TBody> = {},
): Promise<ServiceResult<TData>> {
  const config: AxiosRequestConfig = {
    method,
    url: `${url}${buildQuery(options.query)}`,
    data: options.body,
    signal: options.signal,
  };

  try {
    const response = await http.request<unknown>(config);
    const payload = response.data;

    // If the server already returned a ServiceResult-shaped envelope, pass
    // it through unchanged.
    if (payload && typeof payload === 'object' && 'ok' in (payload as object)) {
      return payload as ServiceResult<TData>;
    }

    return {
      ok: true,
      success: true,
      data: payload as TData,
    };
  } catch (err) {
    const error = err as AxiosError<{
      message?: string;
      error?: { code?: string; message?: string };
      errorCode?: string;
    }>;

    // Network / timeout / no response.
    if (!error.response) {
      return {
        ok: false,
        success: false,
        message:
          "Couldn't reach the server. Please check your internet connection and try again.",
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error',
          status: 503,
        },
      };
    }

    const { status, data } = error.response;
    const errObj = data?.error;
    const message =
      errObj?.message ?? data?.message ?? fallbackForStatus(status);

    return {
      ok: false,
      success: false,
      message,
      errorCode: errObj?.code ?? data?.errorCode ?? `HTTP_${status}`,
      error: {
        code: errObj?.code ?? `HTTP_${status}`,
        message,
        status,
        details: data,
      },
    };
  }
}

export const api = {
  get: <T>(url: string, options?: RequestOptions) => request<T>('GET', url, options),
  post: <T, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) =>
    request<T, B>('POST', url, { ...options, body }),
  put: <T, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) =>
    request<T, B>('PUT', url, { ...options, body }),
  patch: <T, B = unknown>(url: string, body?: B, options?: RequestOptions<B>) =>
    request<T, B>('PATCH', url, { ...options, body }),
  delete: <T>(url: string, options?: RequestOptions) => request<T>('DELETE', url, options),
};
