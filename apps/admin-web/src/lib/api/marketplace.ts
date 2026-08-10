import { apiClient } from '../api-client';
import type { Paginated, Product, ProductStatus, Store } from '../types';

export function listStores() {
  return apiClient.get<Store[]>('/admin/marketplace/stores').then((r) => r.data);
}

export interface AdminListProductsParams {
  status?: ProductStatus;
  storeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listProducts(params: AdminListProductsParams) {
  return apiClient
    .get<Paginated<Product>>('/admin/marketplace/products', { params })
    .then((r) => r.data);
}

export function updateProductStatus(
  id: string,
  body: { status: ProductStatus; rejectionReason?: string },
) {
  return apiClient
    .patch<Product>(`/admin/marketplace/products/${id}/status`, body)
    .then((r) => r.data);
}
