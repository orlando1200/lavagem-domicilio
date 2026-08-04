
type CampaignForm = z.infer<typeof campaignSchema>;

function MetricCard({
  title,
  value,
  sub,




































































  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyCampaign | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data, isLoading, isFetching, refetch } = useLoyaltyCampaigns(page, 20, search, statusFilter);
  const createMutation = useCreateLoyaltyCampaign();
  const updateMutation = useUpdateLoyaltyCampaign();
  const deleteMutation = useDeleteLoyaltyCampaign();






















































































































                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                  Nenhuma campanha encontrada
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="space-y-1">


























































































































































  );
}

export default function FidelidadePage() {
  const { data: overview, refetch: refetchOverview, isFetching: isFetchingOverview } = useLoyaltyOverview();
  const { data: tiers } = useLoyaltyTiers();

  return (
    <div>








        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Clientes ativos"
            value={(overview?.activeMembers ?? 0).toLocaleString('pt-BR')}
            sub="Participando do programa"
            icon={Gift}
            color="bg-blue-500"
          />
          <MetricCard
            title="Pontos emitidos"
            value={(overview?.pointsIssued ?? 0).toLocaleString('pt-BR')}
            sub="Acumulados no período"
            icon={WalletCards}
            color="bg-emerald-500"
          />
          <MetricCard
            title="Pontos resgatados"
            value={(overview?.pointsRedeemed ?? 0).toLocaleString('pt-BR')}
            sub="Convertidos em benefícios"
            icon={Trophy}
            color="bg-amber-500"
          />
          <MetricCard
            title="Taxa de resgate"
            value={`${(overview?.redemptionRate ?? 0).toFixed(1)}%`}
            sub="Eficiência das campanhas"
            icon={Star}
            color="bg-violet-500"
          />
        </div>

        <Tabs defaultValue="campaigns">




          <TabsContent value="campaigns" className="mt-4">
            <CampaignsTab />
          </TabsContent>
          <TabsContent value="tiers" className="mt-4">
            <TiersTab tiers={tiers ?? []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
