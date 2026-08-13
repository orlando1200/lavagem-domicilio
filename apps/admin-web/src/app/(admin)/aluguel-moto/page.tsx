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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { listDriverProfiles } from '@/lib/api/driver-profiles';
import { assignRentalDriver, createRental, listRentals, updateRentalStatus } from '@/lib/api/rentals';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import { rentalStatusLabel, rentalStatusVariant, RENTAL_STATUS_OPTIONS } from '@/lib/status-badge';
import type { Rental, RentalStatus } from '@/lib/types';

export default function AluguelMotoPage() {
  const [status, setStatus] = useState<RentalStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Rental | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'rentals', 'list', { status, search, page }],
    queryFn: () =>
      listRentals({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Aluguel de Moto</h1>
        <p className="text-sm text-muted-foreground">Locações de moto para lavadores.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Buscar</Label>
            <Input
              placeholder="Nome ou e-mail do locatário"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as RentalStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {RENTAL_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {rentalStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CreateRentalDialog />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar as locações.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Locatário</TableHead>
            <TableHead>Motorista atribuído</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor semanal</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.data.length ? (
            data.data.map((rental) => (
              <TableRow
                key={rental.id}
                className="cursor-pointer"
                onClick={() => setSelected(rental)}
              >
                <TableCell className="font-medium">{rental.user.name}</TableCell>
                <TableCell>{rental.driver?.user.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={rentalStatusVariant(rental.status)}>
                    {rentalStatusLabel(rental.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrencyBRL(rental.weeklyRate)}</TableCell>
                <TableCell>{rental.startedAt ? formatDate(rental.startedAt) : '—'}</TableCell>
                <TableCell>{rental.endedAt ? formatDate(rental.endedAt) : '—'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhuma locação encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <RentalDetailSheet rental={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateRentalDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');

  const { data: drivers } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'all-options'],
    queryFn: () => listDriverProfiles({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => createRental({ userId, weeklyRate: Number(weeklyRate) }),
    onSuccess: () => {
      toast.success('Locação criada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'rentals'] });
      setUserId('');
      setWeeklyRate('');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar locação.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova locação</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova locação de moto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lavador locatário</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o lavador" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.data.map((d) => (
                  <SelectItem key={d.userId} value={d.userId}>
                    {d.user.name} ({d.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor semanal</Label>
            <Input type="number" value={weeklyRate} onChange={(e) => setWeeklyRate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!userId || !weeklyRate || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Criando...' : 'Criar locação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RentalDetailSheet({ rental, onClose }: { rental: Rental | null; onClose: () => void }) {
  return (
    <Sheet open={!!rental} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{rental?.user.name}</SheetTitle>
          <SheetDescription>{rental?.user.email}</SheetDescription>
        </SheetHeader>

        {/* key={rental.id} forca remount ao trocar de locacao selecionada. */}
        {rental && <RentalDetailContent key={rental.id} rental={rental} />}
      </SheetContent>
    </Sheet>
  );
}

function RentalDetailContent({ rental }: { rental: Rental }) {
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState('');
  const [newStatus, setNewStatus] = useState<RentalStatus | ''>('');

  const { data: activeDrivers } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'active-options'],
    queryFn: () => listDriverProfiles({ status: 'active', limit: 100 }),
  });

  const assignMutation = useMutation({
    mutationFn: () => assignRentalDriver(rental.id, driverId),
    onSuccess: () => {
      toast.success('Motorista atribuído.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'rentals'] });
      setDriverId('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atribuir motorista.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: () => updateRentalStatus(rental.id, { status: newStatus as RentalStatus }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'rentals'] });
      setNewStatus('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status.');
    },
  });

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant={rentalStatusVariant(rental.status)}>{rentalStatusLabel(rental.status)}</Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Valor semanal</p>
          <p className="font-medium">{formatCurrencyBRL(rental.weeklyRate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Motorista atribuído</p>
          <p className="font-medium">{rental.driver?.user.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Criada em</p>
          <p className="font-medium">{formatDate(rental.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Atribuir motorista</p>
        <Select value={driverId} onValueChange={setDriverId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o motorista" />
          </SelectTrigger>
          <SelectContent>
            {activeDrivers?.data.map((d) => (
              <SelectItem key={d.userId} value={d.userId}>
                {d.user.name} ({d.user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="w-full"
          disabled={!driverId || assignMutation.isPending}
          onClick={() => assignMutation.mutate()}
        >
          {assignMutation.isPending ? 'Atribuindo...' : 'Atribuir'}
        </Button>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Forçar status</p>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RentalStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o novo status" />
          </SelectTrigger>
          <SelectContent>
            {RENTAL_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {rentalStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="w-full"
          disabled={!newStatus || statusMutation.isPending}
          onClick={() => statusMutation.mutate()}
        >
          {statusMutation.isPending ? 'Salvando...' : 'Salvar status'}
        </Button>
      </div>
    </div>
  );
}
