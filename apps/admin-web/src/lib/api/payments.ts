import { apiClient } from '../api-client';
import type { Paginated, Payment, PaymentMethod, PaymentsReport, PaymentStatus } from '../types';

export interface AdminPaymentsFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function listPayments(filters: AdminPaymentsFilters & { page?: number; limit?: number }) {
  return apiClient.get<Paginated<Payment>>('/admin/payments', { params: filters }).then((r) => r.data);
}

export function getPaymentsReport(filters: AdminPaymentsFilters) {
  return apiClient
    .get<PaymentsReport>('/admin/payments/report', { params: filters })
    .then((r) => r.data);
}

export function exportPayments(filters: AdminPaymentsFilters) {
  return apiClient.get<Payment[]>('/admin/payments/export', { params: filters }).then((r) => r.data);
}
