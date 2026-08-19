import { apiClient } from '../api-client';
import type { VehicleBrand, VehicleCatalogModel, VehicleCatalogType, VehicleCatalogYear } from '../types';

export function listVehicleBrands() {
  return apiClient.get<VehicleBrand[]>('/admin/vehicle-catalog/brands').then((r) => r.data);
}

export function createVehicleBrand(body: { name: string; active?: boolean }) {
  return apiClient.post<VehicleBrand>('/admin/vehicle-catalog/brands', body).then((r) => r.data);
}

export function updateVehicleBrand(id: string, body: Partial<{ name: string; active: boolean }>) {
  return apiClient.patch<VehicleBrand>(`/admin/vehicle-catalog/brands/${id}`, body).then((r) => r.data);
}

export function deleteVehicleBrand(id: string) {
  return apiClient.delete<{ message: string }>(`/admin/vehicle-catalog/brands/${id}`).then((r) => r.data);
}

export function listVehicleCatalogModels(brandId?: string) {
  return apiClient
    .get<VehicleCatalogModel[]>('/admin/vehicle-catalog/models', { params: brandId ? { brandId } : undefined })
    .then((r) => r.data);
}

export function createVehicleCatalogModel(body: { brandId: string; name: string; vehicleType: VehicleCatalogType; active?: boolean }) {
  return apiClient.post<VehicleCatalogModel>('/admin/vehicle-catalog/models', body).then((r) => r.data);
}

export function updateVehicleCatalogModel(
  id: string,
  body: Partial<{ name: string; vehicleType: VehicleCatalogType; active: boolean }>,
) {
  return apiClient.patch<VehicleCatalogModel>(`/admin/vehicle-catalog/models/${id}`, body).then((r) => r.data);
}

export function deleteVehicleCatalogModel(id: string) {
  return apiClient.delete<{ message: string }>(`/admin/vehicle-catalog/models/${id}`).then((r) => r.data);
}

export function listVehicleCatalogYears(modelId?: string) {
  return apiClient
    .get<VehicleCatalogYear[]>('/admin/vehicle-catalog/years', { params: modelId ? { modelId } : undefined })
    .then((r) => r.data);
}

export function createVehicleCatalogYear(body: { modelId: string; year: number; active?: boolean }) {
  return apiClient.post<VehicleCatalogYear>('/admin/vehicle-catalog/years', body).then((r) => r.data);
}

export function updateVehicleCatalogYear(id: string, body: Partial<{ year: number; active: boolean }>) {
  return apiClient.patch<VehicleCatalogYear>(`/admin/vehicle-catalog/years/${id}`, body).then((r) => r.data);
}

export function deleteVehicleCatalogYear(id: string) {
  return apiClient.delete<{ message: string }>(`/admin/vehicle-catalog/years/${id}`).then((r) => r.data);
}
