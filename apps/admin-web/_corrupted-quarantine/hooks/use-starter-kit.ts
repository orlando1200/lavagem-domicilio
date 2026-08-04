export function useUpsertStarterKitConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Pick<StarterKitConfig, 'productId' | 'minPrice' | 'maxPrice' | 'maxInstallments' | 'active'>
    ) => {
      const { data } = await api.put<StarterKitConfig>('/admin/starter-kit/config', {
        ...payload,
        isActive: payload.active,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['starter-kit-config'] });
    },
