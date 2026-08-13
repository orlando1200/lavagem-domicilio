import { apiClient } from '../api-client';
import type { Paginated, SupportTicket, SupportTicketStatus } from '../types';

export interface AdminListSupportTicketsParams {
  status?: SupportTicketStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export function listSupportTickets(params: AdminListSupportTicketsParams) {
  return apiClient
    .get<Paginated<SupportTicket>>('/admin/support/tickets', { params })
    .then((r) => r.data);
}

export function getSupportTicket(id: string) {
  return apiClient.get<SupportTicket>(`/admin/support/tickets/${id}`).then((r) => r.data);
}

export function updateSupportTicketStatus(id: string, body: { status: SupportTicketStatus }) {
  return apiClient
    .patch<SupportTicket>(`/admin/support/tickets/${id}/status`, body)
    .then((r) => r.data);
}
