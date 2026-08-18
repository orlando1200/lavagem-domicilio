import { apiClient } from '../api-client';
import type { DocumentVerification, DocumentVerificationStatus, Paginated } from '../types';

export interface AdminListDocumentVerificationsParams {
  status?: DocumentVerificationStatus;
  userId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listDocumentVerifications(params: AdminListDocumentVerificationsParams) {
  return apiClient
    .get<Paginated<DocumentVerification>>('/admin/document-verification', { params })
    .then((r) => r.data);
}

export function getDocumentVerification(id: string) {
  return apiClient
    .get<DocumentVerification>(`/admin/document-verification/${id}`)
    .then((r) => r.data);
}

export function reviewDocumentVerification(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
) {
  return apiClient
    .patch<DocumentVerification>(`/admin/document-verification/${id}/review`, {
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    })
    .then((r) => r.data);
}
