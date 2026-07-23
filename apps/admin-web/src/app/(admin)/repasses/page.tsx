} from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function RepassesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionRepayment, setActionRepayment] = useState<Repayment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'paid' | null>(null);

  const { data, isLoading, refetch, isFetching } = useRepayments(page, 20, statusFilter);
  const approveMutation = useApproveRepayment();
  const paidMutation = useMarkRepaymentPaid();
  const { toast } = useToast();


























    }
  }

  // Filtered by search client-side
  const displayed = data && search
    ? { ...data, data: data.data.filter((r) => r.washer?.user?.name?.toLowerCase().includes(search.toLowerCase())) }
    : data;

  const isMutating = approveMutation.isPending || paidMutation.isPending;





      <div className="p-6">
        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {data?.data.filter((r) => r.status === 'pending').length ?? 0}
            </p>
            <p className="text-xs text-gray-400">
              {formatCurrency(data?.data.filter((r) => r.status === 'pending').reduce((s, r) => s + r.netAmount, 0) ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-500">Aprovados</p>
            <p className="text-2xl font-bold text-blue-600">
              {data?.data.filter((r) => r.status === 'approved').length ?? 0}
            </p>
            <p className="text-xs text-gray-400">
              {formatCurrency(data?.data.filter((r) => r.status === 'approved').reduce((s, r) => s + r.netAmount, 0) ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-sm text-gray-500">Pagos (mês atual)</p>
            <p className="text-2xl font-bold text-green-600">
              {data?.data.filter((r) => r.status === 'paid').length ?? 0}
            </p>
            <p className="text-xs text-gray-400">
              {formatCurrency(data?.data.filter((r) => r.status === 'paid').reduce((s, r) => s + r.netAmount, 0) ?? 0)}
            </p>
          </div>
        </div>

        {/* Toolbar */}


















































                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : !displayed?.data.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhum repasse encontrado
                  </TableCell>
                </TableRow>
              ) : (
                displayed?.data.map((repayment) => (
                  <TableRow key={repayment.id}>
                    <TableCell>
                      <div>


























































        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
