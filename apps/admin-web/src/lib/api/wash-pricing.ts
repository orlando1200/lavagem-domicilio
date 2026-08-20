import { apiClient } from '../api-client';
import type { CarSize, WashPriceEntry, WashType } from '../types';

export function listWashPrices() {
  return apiClient.get<WashPriceEntry[]>('/admin/wash-pricing').then((r) => r.data);
}

export function createWashPrice(body: { carSize: CarSize; washType: WashType; price: number; active?: boolean }) {
  return apiClient.post<WashPriceEntry>('/admin/wash-pricing', body).then((r) => r.data);
}

export function updateWashPrice(id: string, body: Partial<{ price: number; active: boolean }>) {
  return apiClient.patch<WashPriceEntry>(`/admin/wash-pricing/${id}`, body).then((r) => r.data);
}
