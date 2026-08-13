import { apiClient } from '../api-client';
import type { Paginated, ZoneAdmin } from '../types';

export interface AdminListZonesParams {
  state?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function listZones(params: AdminListZonesParams) {
  return apiClient.get<Paginated<ZoneAdmin>>('/admin/zones', { params }).then((r) => r.data);
}

export function getZone(id: string) {
  return apiClient.get<ZoneAdmin>(`/admin/zones/${id}`).then((r) => r.data);
}

export interface CreateZoneBody {
  city: string;
  state: string;
  name: string;
  slug: string;
  neighborhoods?: string[];
  isActive?: boolean;
}

export function createZone(body: CreateZoneBody) {
  return apiClient.post<ZoneAdmin>('/admin/zones', body).then((r) => r.data);
}

export function updateZone(id: string, body: Partial<CreateZoneBody>) {
  return apiClient.patch<ZoneAdmin>(`/admin/zones/${id}`, body).then((r) => r.data);
}

export function deactivateZone(id: string) {
  return apiClient.delete<ZoneAdmin>(`/admin/zones/${id}`).then((r) => r.data);
}
