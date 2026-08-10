import { apiClient } from '../api-client';
import type { Paginated, Payout, PayoutStatus } from '../types';

export interface AdminListPayoutsParams {
  status?: PayoutStatus;
  washerId?: string;
  storeId?: string;
  page?: number;
  limit?: number;
}

export function listPayouts(params: AdminListPayoutsParams) {
  return apiClient.get<Paginated<Payout>>('/admin/payouts', { params }).then((r) => r.data);
}

export function getPayout(id: string) {
  return apiClient.get<Payout>(`/admin/payouts/${id}`).then((r) => r.data);
}

export function generateWasherPayout(body: {
  washerId: string;
  periodStart: string;
  periodEnd: string;
  commissionRate?: number;
}) {
  return apiClient.post<Payout>('/admin/payouts/washers', body).then((r) => r.data);
}

export function generateStorePayout(body: {
  storeId: string;
  periodStart: string;
  periodEnd: string;
}) {
  return apiClient.post<Payout>('/admin/payouts/stores', body).then((r) => r.data);
}

export function updatePayoutStatus(
  id: string,
  body: { status: PayoutStatus; rejectionReason?: string; providerReference?: string },
) {
  return apiClient.patch<Payout>(`/admin/payouts/${id}/status`, body).then((r) => r.data);
}
