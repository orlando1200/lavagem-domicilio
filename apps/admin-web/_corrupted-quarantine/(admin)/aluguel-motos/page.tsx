  const [editingOffer, setEditingOffer] = useState<MotoOffer | null>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  const { data: offers = [], isLoading } = usePartnerOffers(partner.id);
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const deleteOffer = useDeleteOffer();













































  description: z.string().optional(),
});

type OfferForm = z.infer<typeof offerSchema>;

// ─── Metrics cards ────────────────────────────────────────────────────────────

function MetricsCards() {
  const { data: metrics = mockMetrics } = useRentalMetrics();

  const cards = [
    { label: 'Total de Parceiros', value: metrics.totalPartners, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Parceiros Ativos', value: metrics?.activePartners ?? 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total de Ofertas', value: metrics?.totalOffers ?? 0, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ofertas Disponíveis', value: metrics?.availableOffers ?? 0, icon: Bike, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">


































































































































































  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useRentalPartners(page, 20, search, statusFilter);
  const createMutation = useCreateRentalPartner();
  const updateMutation = useUpdateRentalPartner();
  const deleteMutation = useDeleteRentalPartner();





















































































































                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhum parceiro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((partner) => {
                  const isExpanded = expandedPartnerId === partner.id;
                  return (
                    <React.Fragment key={partner.id}>





























































          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="flex items-center px-3 text-sm text-gray-600">{page} / {data.totalPages}</span>
