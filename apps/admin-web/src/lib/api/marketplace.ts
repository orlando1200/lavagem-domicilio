import { apiClient } from '../api-client';
import type { Paginated, Product, ProductFitment, ProductStatus, Store, StoreStatus } from '../types';

export function listStores() {
  return apiClient.get<Store[]>('/admin/marketplace/stores').then((r) => r.data);
}

export function updateStoreStatus(id: string, status: StoreStatus) {
  return apiClient
    .patch<Store>(`/admin/marketplace/stores/${id}/status`, { status })
    .then((r) => r.data);
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

export interface FitmentRuleBody {
  universal?: boolean;
  brandId?: string;
  modelId?: string;
  yearFrom?: number;
  yearTo?: number;
}

export function listProductFitments(productId: string) {
  return apiClient
    .get<ProductFitment[]>(`/admin/marketplace/products/${productId}/fitments`)
    .then((r) => r.data);
}

export function replaceProductFitments(productId: string, fitments: FitmentRuleBody[]) {
  return apiClient
    .post<ProductFitment[]>(`/admin/marketplace/products/${productId}/fitments`, { fitments })
    .then((r) => r.data);
}

export interface FitmentImportError {
  row: number;
  sku: string;
  message: string;
}

export interface FitmentImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: FitmentImportError[];
}

export function importFitmentsCsv(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient
    .post<FitmentImportResult>('/admin/marketplace/fitments/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}
