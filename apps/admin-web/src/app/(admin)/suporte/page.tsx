} from '@/types';
import { formatDate } from '@/lib/utils';

function MetricCard({
  title,
  value,
  sub,
























  );
}

export default function SuportePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data: overview, refetch: refetchOverview } = useSupportOverview();
  const { data, isLoading, isFetching, refetch } = useSupportTickets(page, 20, search, statusFilter);
  const updateStatusMutation = useUpdateSupportTicketStatus();
  const { toast } = useToast();

  const tickets = useMemo(() => data?.data ?? [], [data]);

  async function handleStatusChange(id: string, status: SupportTicketStatus) {
    try {















      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Tickets abertos"
            value={(overview?.openTickets ?? 0).toLocaleString('pt-BR')}
            sub="Fila ativa no momento"
            icon={Headphones}
            color="bg-blue-500"
          />
          <MetricCard
            title="SLA do dia"
            value={`${overview?.slaToday ?? 0}%`}
            sub="Tickets dentro do prazo"
            icon={ShieldCheck}
            color="bg-emerald-500"
          />
          <MetricCard
            title="1ª resposta média"
            value={`${overview?.avgFirstResponseMinutes ?? 0} min`}
            sub="Tempo médio de retorno"
            icon={Clock3}
            color="bg-amber-500"
          />
          <MetricCard
            title="CSAT"
            value={`${(overview?.csat ?? 0).toFixed(1)} / 5`}
            sub="Satisfação dos atendimentos"
            icon={MessageSquare}
            color="bg-violet-500"
          />
        </div>

        <div className="rounded-lg border bg-white p-4">
