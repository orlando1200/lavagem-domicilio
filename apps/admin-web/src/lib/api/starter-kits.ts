import { apiClient } from '../api-client';
import type { Paginated, StarterKit, StarterKitStatus } from '../types';

export interface AdminListStarterKitsParams {
  status?: StarterKitStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function listStarterKits(params: AdminListStarterKitsParams) {
  return apiClient.get<Paginated<StarterKit>>('/admin/starter-kits', { params }).then((r) => r.data);
}

export function getStarterKit(washerId: string) {
  return apiClient.get<StarterKit>(`/admin/starter-kits/${washerId}`).then((r) => r.data);
}

export interface CreateStarterKitBody {
  washerId: string;
  price: number;
  installments?: number;
}

export function createStarterKit(body: CreateStarterKitBody) {
  return apiClient.post<StarterKit>('/admin/starter-kits', body).then((r) => r.data);
}

export function updateStarterKitStatus(washerId: string, body: { status: StarterKitStatus }) {
  return apiClient
    .patch<StarterKit>(`/admin/starter-kits/${washerId}/status`, body)
    .then((r) => r.data);
}
