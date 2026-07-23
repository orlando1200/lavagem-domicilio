
type CouponForm = z.infer<typeof couponSchema>;

const STATUS_VARIANT: Record<CouponStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  active: 'success',
  inactive: 'secondary',
  expired: 'destructive',
};

export default function CuponsPage() {
  const [page, setPage] = useState(1);



  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useCoupons(page, 20, search, statusFilter);
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();



















































































































                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhum cupom encontrado
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <span className="flex items-center gap-1.5 font-mono text-sm font-semibold text-gray-700">







































        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
