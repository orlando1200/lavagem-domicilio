  active: z.boolean(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const [page, setPage] = useState(1);




  const [editing, setEditing] = useState<MarketplaceProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useMarketplaceProducts(page, 20, search, statusFilter, supplierFilter);
  const { data: allSuppliers } = useAllSuppliers();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();




















































































            <SelectTrigger className="w-44">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos fornecedores</SelectItem>
              {allSuppliers?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Atualizar">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />



























                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">








































        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="flex items-center px-3 text-sm text-gray-600">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>























                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSuppliers?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>





























































































  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useSuppliers(page, 20, search);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

































































































                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
