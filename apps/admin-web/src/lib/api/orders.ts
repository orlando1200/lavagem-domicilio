import { apiClient } from '../api-client';
import type { Order, OrderStatus, Paginated } from '../types';

export interface AdminListOrdersParams {
  status?: OrderStatus;
  search?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function listOrders(params: AdminListOrdersParams) {
  return apiClient
    .get<Paginated<Order>>('/admin/orders', { params })
    .then((r) => r.data);
}

export function getOrder(id: string) {
  return apiClient.get<Order>(`/admin/orders/${id}`).then((r) => r.data);
}

export function assignDriver(id: string, driverId: string) {
  return apiClient
    .patch<Order>(`/admin/orders/${id}/assign-driver`, { driverId })
    .then((r) => r.data);
}

export function updateOrderStatus(id: string, body: { status: OrderStatus; reason?: string }) {
  return apiClient.patch<Order>(`/admin/orders/${id}/status`, body).then((r) => r.data);
}
