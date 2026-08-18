import { apiClient } from '../api-client';
import type { ServiceCategory, ServiceType } from '../types';

export function listServiceCategories() {
  return apiClient.get<ServiceCategory[]>('/admin/service-categories').then((r) => r.data);
}

export interface CreateServiceCategoryBody {
  serviceType: ServiceType;
  name: string;
  description?: string;
  price: number;
  active?: boolean;
}

export function createServiceCategory(body: CreateServiceCategoryBody) {
  return apiClient.post<ServiceCategory>('/admin/service-categories', body).then((r) => r.data);
}

export function updateServiceCategory(id: string, body: Partial<Omit<CreateServiceCategoryBody, 'serviceType'>>) {
  return apiClient.patch<ServiceCategory>(`/admin/service-categories/${id}`, body).then((r) => r.data);
}

export function deleteServiceCategory(id: string) {
  return apiClient.delete<{ message: string }>(`/admin/service-categories/${id}`).then((r) => r.data);
}
