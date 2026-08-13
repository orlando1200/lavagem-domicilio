import { apiClient } from '../api-client';
import type { DashboardSummary } from '../types';

export function getDashboardSummary() {
  return apiClient.get<DashboardSummary>('/admin/dashboard/summary').then((r) => r.data);
}
