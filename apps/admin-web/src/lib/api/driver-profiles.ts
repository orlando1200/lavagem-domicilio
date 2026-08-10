import { apiClient } from '../api-client';
import type { DriverProfile, DriverStatus, DriverType, Paginated } from '../types';

export interface AdminListDriverProfilesParams {
  status?: DriverStatus;
  driverType?: DriverType;
  search?: string;
  page?: number;
  limit?: number;
}

export function listDriverProfiles(params: AdminListDriverProfilesParams) {
  return apiClient
    .get<Paginated<DriverProfile>>('/admin/driver-profiles', { params })
    .then((r) => r.data);
}

export function getDriverProfile(userId: string) {
  return apiClient.get<DriverProfile>(`/admin/driver-profiles/${userId}`).then((r) => r.data);
}

export function updateDriverProfileStatus(
  userId: string,
  body: { status: DriverStatus; reason?: string },
) {
  return apiClient
    .patch<DriverProfile>(`/admin/driver-profiles/${userId}/status`, body)
    .then((r) => r.data);
}
