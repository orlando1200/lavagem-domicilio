import { apiClient } from '../api-client';
import type { Paginated, Rental, RentalStatus } from '../types';

export interface AdminListRentalsParams {
  status?: RentalStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function listRentals(params: AdminListRentalsParams) {
  return apiClient.get<Paginated<Rental>>('/admin/rentals', { params }).then((r) => r.data);
}

export function getRental(id: string) {
  return apiClient.get<Rental>(`/admin/rentals/${id}`).then((r) => r.data);
}

export interface CreateRentalBody {
  userId: string;
  weeklyRate: number;
}

export function createRental(body: CreateRentalBody) {
  return apiClient.post<Rental>('/admin/rentals', body).then((r) => r.data);
}

export function assignRentalDriver(id: string, driverId: string) {
  return apiClient
    .patch<Rental>(`/admin/rentals/${id}/assign-driver`, { driverId })
    .then((r) => r.data);
}

export function updateRentalStatus(id: string, body: { status: RentalStatus }) {
  return apiClient.patch<Rental>(`/admin/rentals/${id}/status`, body).then((r) => r.data);
}
