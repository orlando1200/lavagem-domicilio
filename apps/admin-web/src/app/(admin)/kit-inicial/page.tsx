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
import { createStarterKit, listStarterKits, updateStarterKitStatus } from '@/lib/api/starter-kits';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import {
  starterKitStatusLabel,
  starterKitStatusVariant,
  STARTER_KIT_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { StarterKit, StarterKitStatus } from '@/lib/types';

export default function KitInicialPage() {
  const [status, setStatus] = useState<StarterKitStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StarterKit | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'starter-kits', 'list', { status, search, page }],
    queryFn: () =>
      listStarterKits({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Kit Inicial</h1>
        <p className="text-sm text-muted-foreground">Kits iniciais atribuídos a lavadores.</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Buscar</Label>
            <Input
              placeholder="Nome ou e-mail do lavador"
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
                setStatus(v as StarterKitStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {STARTER_KIT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {starterKitStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <CreateStarterKitDialog />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os kits.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lavador</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Parcelas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pago em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.data.length ? (
            data.data.map((kit) => (
              <TableRow
                key={kit.washerId}
                className="cursor-pointer"
                onClick={() => setSelected(kit)}
              >
                <TableCell className="font-medium">{kit.washer.user.name}</TableCell>
                <TableCell>{formatCurrencyBRL(kit.price)}</TableCell>
                <TableCell>{kit.installments}x</TableCell>
                <TableCell>
                  <Badge variant={starterKitStatusVariant(kit.status)}>
                    {starterKitStatusLabel(kit.status)}
                  </Badge>
                </TableCell>
                <TableCell>{kit.paidAt ? formatDate(kit.paidAt) : '—'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Nenhum kit encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <StarterKitDetailSheet kit={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateStarterKitDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [washerId, setWasherId] = useState('');
  const [price, setPrice] = useState('');
  const [installments, setInstallments] = useState('1');

  const { data: drivers } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'active-options'],
    queryFn: () => listDriverProfiles({ status: 'active', limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createStarterKit({
        washerId,
        price: Number(price),
        installments: installments ? Number(installments) : undefined,
      }),
    onSuccess: () => {
      toast.success('Kit inicial criado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'starter-kits'] });
      setWasherId('');
      setPrice('');
      setInstallments('1');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar kit inicial.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo kit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo kit inicial</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Lavador</Label>
            <Select value={washerId} onValueChange={setWasherId}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preço</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={1}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!washerId || !price || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Criando...' : 'Criar kit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StarterKitDetailSheet({ kit, onClose }: { kit: StarterKit | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<StarterKitStatus | ''>('');

  const mutation = useMutation({
    mutationFn: () => updateStarterKitStatus(kit!.washerId, { status: newStatus as StarterKitStatus }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'starter-kits'] });
      setNewStatus('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status.');
    },
  });

  return (
    <Sheet open={!!kit} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{kit?.washer.user.name}</SheetTitle>
          <SheetDescription>{kit?.washer.user.email}</SheetDescription>
        </SheetHeader>

        {kit && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Preço</p>
                <p className="font-medium">{formatCurrencyBRL(kit.price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcelas</p>
                <p className="font-medium">{kit.installments}x</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status atual</p>
                <Badge variant={starterKitStatusVariant(kit.status)}>
                  {starterKitStatusLabel(kit.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Pago em</p>
                <p className="font-medium">{kit.paidAt ? formatDate(kit.paidAt) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{kit.washer.user.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(kit.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Forçar status</p>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StarterKitStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {STARTER_KIT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {starterKitStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={!newStatus || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar status'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
