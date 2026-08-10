import { apiClient } from '../api-client';
import type { AdminUser } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export function login(email: string, password: string) {
  return apiClient
    .post<LoginResponse>('/auth/login', { email, password })
    .then((r) => r.data);
}

export function getMe() {
  return apiClient.get<AdminUser>('/users/me').then((r) => r.data);
}
