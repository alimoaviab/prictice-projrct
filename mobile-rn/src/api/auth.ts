/**
 * Auth API surface — endpoints match the existing Go backend that the web
 * app already talks to. Kept thin so the auth store has a stable contract
 * regardless of how the endpoints evolve.
 */

import { api } from '@/api/client';
import type { LoginRequest, LoginResponse } from '@/types/auth';

export const authApi = {
  login: (body: LoginRequest) => api.post<LoginResponse, LoginRequest>('/auth/login', body),
  logout: () => api.post<{ ok: true }>('/auth/logout'),
};
