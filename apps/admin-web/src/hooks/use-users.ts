  OperationalDashboardMetrics,
} from '@/types';

export function useUsers(page = 1, limit = 20, role?: string, search?: string) {
  return useQuery({
    queryKey: ['users', page, limit, role, search],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/admin/users', {
        params: { page, limit, role, search },
      });
      return data;
    },
  });
}

export function useWashers(page = 1, limit = 20, status?: string, search?: string) {
  return useQuery({
    queryKey: ['washers', page, limit, status, search],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Washer>>('/admin/washers', {
        params: { page, limit, status, search },
      });
      return data;
    },
  });
}

export function useDashboardMetrics() {
  return useQuery({
