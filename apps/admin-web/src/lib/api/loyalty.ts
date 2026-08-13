import { apiClient } from '../api-client';
import type { LoyaltyReport } from '../types';

export function getLoyaltyReport(limit?: number) {
  return apiClient
    .get<LoyaltyReport>('/admin/loyalty/report', { params: { limit } })
    .then((r) => r.data);
}

export function grantLoyaltyForOrder(orderId: string) {
  return apiClient.post(`/admin/loyalty/orders/${orderId}/grant`).then((r) => r.data);
}

export function expireOverdueLoyalty() {
  return apiClient
    .post<{ expiredCount: number }>('/admin/loyalty/expire-overdue')
    .then((r) => r.data);
}
