'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { listDriverProfiles } from '@/lib/api/driver-profiles';
import { listStores } from '@/lib/api/marketplace';
import {
  generateStorePayout,
  generateWasherPayout,
  listPayouts,
  updatePayoutStatus,
} from '@/lib/api/payouts';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import { payoutStatusLabel, payoutStatusVariant, PAYOUT_STATUS_OPTIONS } from '@/lib/status-badge';
import type { Payout, PayoutStatus } from '@/lib/types';

export default function RepassesPage() {
  const [status, setStatus] = useState<PayoutStatus | 'all'>('all');
  const [washerId, setWasherId] = useState('all');
  const [storeId, setStoreId] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  const { data: activeDrivers } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'active-options'],
    queryFn: () => listDriverProfiles({ status: 'active', limit: 100 }),
  });

  const { data: stores } = useQuery({
    queryKey: ['admin', 'marketplace', 'stores'],
    queryFn: listStores,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'payouts', 'list', { status, washerId, storeId, page }],
    queryFn: () =>
      listPayouts({
        status: status === 'all' ? undefined : status,
        washerId: washerId === 'all' ? undefined : washerId,
        storeId: storeId === 'all' ? undefined : storeId,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Repasses</h1>
          <p className="text-sm text-muted-foreground">Repasses a lavadores e lojas.</p>
        </div>
        <div className="flex gap-2">
          <GenerateWasherPayoutDialog drivers={activeDrivers?.data ?? []} />
          <GenerateStorePayoutDialog stores={stores ?? []} />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as PayoutStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PAYOUT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {payoutStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Lavador</Label>
          <Select
            value={washerId}
            onValueChange={(v) => {
              setWasherId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os lavadores</SelectItem>
              {activeDrivers?.data.map((d) => (
                <SelectItem key={d.userId} value={d.userId}>
                  {d.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Loja</Label>
          <Select
            value={storeId}
            onValueChange={(v) => {
              setStoreId(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {stores?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os repasses.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Destinatário</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Bruto</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Líquido</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.data.length ? (
            data.data.map((payout) => (
              <TableRow
                key={payout.id}
                className="cursor-pointer"
                onClick={() => setSelectedPayout(payout)}
              >
                <TableCell>
                  <Badge variant="outline">
                    {payout.recipientType === 'WASHER' ? 'Lavador' : 'Loja'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {payout.recipientWasher?.user.name ?? payout.recipientStore?.name ?? '—'}
                </TableCell>
                <TableCell>
                  {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
                </TableCell>
                <TableCell>{payout.ordersCount}</TableCell>
                <TableCell>{formatCurrencyBRL(payout.grossAmount)}</TableCell>
                <TableCell>{formatCurrencyBRL(payout.commissionAmount)}</TableCell>
                <TableCell>{formatCurrencyBRL(payout.netAmount)}</TableCell>
                <TableCell>
                  <Badge variant={payoutStatusVariant(payout.status)}>
                    {payoutStatusLabel(payout.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                Nenhum repasse encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <PayoutStatusDialog payout={selectedPayout} onClose={() => setSelectedPayout(null)} />
    </div>
  );
}

function GenerateWasherPayoutDialog({
  drivers,
}: {
  drivers: { userId: string; user: { name: string } }[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [washerId, setWasherId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [commissionRate, setCommissionRate] = useState('0');

  const mutation = useMutation({
    mutationFn: () =>
      generateWasherPayout({
        washerId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        commissionRate: Number(commissionRate) || 0,
      }),
    onSuccess: () => {
      toast.success('Repasse de lavador gerado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts', 'list'] });
      setOpen(false);
      setWasherId('');
      setPeriodStart('');
      setPeriodEnd('');
      setCommissionRate('0');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao gerar repasse.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerar repasse de lavador</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar repasse de lavador</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lavador</Label>
            <Select value={washerId} onValueChange={setWasherId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lavador" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((d) => (
                  <SelectItem key={d.userId} value={d.userId}>
                    {d.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início do período</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim do período</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Comissão da plataforma (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!washerId || !periodStart || !periodEnd || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Gerando...' : 'Gerar repasse'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateStorePayoutDialog({ stores }: { stores: { id: string; name: string }[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      generateStorePayout({
        storeId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Repasse de loja gerado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts', 'list'] });
      setOpen(false);
      setStoreId('');
      setPeriodStart('');
      setPeriodEnd('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao gerar repasse.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Gerar repasse de loja</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar repasse de loja</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Loja</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início do período</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim do período</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!storeId || !periodStart || !periodEnd || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Gerando...' : 'Gerar repasse'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayoutStatusDialog({
  payout,
  onClose,
}: {
  payout: Payout | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<PayoutStatus | ''>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [providerReference, setProviderReference] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      updatePayoutStatus(payout!.id, {
        status: newStatus as PayoutStatus,
        rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
        providerReference: providerReference || undefined,
      }),
    onSuccess: () => {
      toast.success('Status do repasse atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
      setNewStatus('');
      setRejectionReason('');
      setProviderReference('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar repasse.');
    },
  });

  const isPaid = payout?.status === 'paid';

  return (
    <Dialog open={!!payout} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {payout?.recipientWasher?.user.name ?? payout?.recipientStore?.name}
          </DialogTitle>
        </DialogHeader>

        {isPaid ? (
          <p className="text-sm text-muted-foreground">
            Este repasse já foi pago e não pode mais ser alterado.
          </p>
        ) : (
          <div className="space-y-3">
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PayoutStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">{payoutStatusLabel('approved')}</SelectItem>
                <SelectItem value="paid">{payoutStatusLabel('paid')}</SelectItem>
                <SelectItem value="rejected">{payoutStatusLabel('rejected')}</SelectItem>
              </SelectContent>
            </Select>
            {newStatus === 'rejected' && (
              <Textarea
                placeholder="Motivo da rejeição (obrigatório)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            )}
            {newStatus === 'paid' && (
              <Input
                placeholder="Referência do provedor de pagamento (opcional)"
                value={providerReference}
                onChange={(e) => setProviderReference(e.target.value)}
              />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={
              isPaid ||
              !newStatus ||
              (newStatus === 'rejected' && !rejectionReason) ||
              mutation.isPending
            }
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
