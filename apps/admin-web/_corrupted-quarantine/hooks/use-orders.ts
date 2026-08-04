  return useQuery({
    queryKey: ['orders', page, limit, filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Order>>('/admin/orders', {
        params: {
          page,
          limit,
          ...(filters?.status
            ? { status: Array.isArray(filters.status) ? filters.status.join(',') : filters.status }
            : {}),
          ...(filters?.search ? { search: filters.search } : {}),
          ...(filters?.dateFrom ? { startDate: filters.dateFrom } : {}),
          ...(filters?.dateTo ? { endDate: filters.dateTo } : {}),
          ...(filters?.washerId ? { washerId: filters.washerId } : {}),
        },
      });
      return data;
    },
  });
