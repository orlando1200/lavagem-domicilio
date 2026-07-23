    path: ['maxPrice'],
  });

type KitForm = z.infer<typeof kitSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KitInicialPage() {
  const { toast } = useToast();

  const { data: config, isLoading: isLoadingConfig, refetch, isFetching } = useStarterKitConfig();
  const { data: products, isLoading: isLoadingProducts } = useStarterKitProducts();
  const saveMutation = useUpsertStarterKitConfig();

  const form = useForm<KitForm>({
    resolver: zodResolver(kitSchema),































  const isActive = form.watch('active');
  const selectedProductId = form.watch('productId');
  const selectedProduct = products?.find((p) => p.id === selectedProductId);

  const displayProducts = products ?? [];

  const isLoading = isLoadingConfig || isLoadingProducts;




















































                    <SelectValue placeholder="Selecionar produto marcado como Kit Inicial..." />
                  </SelectTrigger>
                  <SelectContent>
                    {displayProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          {p.name}
