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
import { Textarea } from '@/components/ui/textarea';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { createZone, deactivateZone, listZones, updateZone } from '@/lib/api/zones';
import { formatDate } from '@/lib/format';
import type { ZoneAdmin } from '@/lib/types';

function neighborhoodsToText(neighborhoods: string[]): string {
  return neighborhoods.join(', ');
}

function textToNeighborhoods(text: string): string[] {
  return text
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);
}

export default function ZonasPage() {
  const [state, setState] = useState('all');
  const [isActive, setIsActive] = useState<'all' | 'true' | 'false'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ZoneAdmin | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'zones', 'list', { state, isActive, search, page }],
    queryFn: () =>
      listZones({
        state: state === 'all' ? undefined : state,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Zonas de Cobertura</h1>
        <p className="text-sm text-muted-foreground">
          Zonas usadas no matching de pedidos com lavadores.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Buscar</Label>
            <Input
              placeholder="Nome ou cidade"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>UF</Label>
            <Input
              placeholder="SP"
              value={state === 'all' ? '' : state}
              maxLength={2}
              onChange={(e) => {
                setState(e.target.value ? e.target.value.toUpperCase() : 'all');
                setPage(1);
              }}
              className="w-20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={isActive}
              onValueChange={(v) => {
                setIsActive(v as 'all' | 'true' | 'false');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativas</SelectItem>
                <SelectItem value="false">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <CreateZoneDialog />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar as zonas.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Bairros</TableHead>
            <TableHead>Lavadores</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.data.length ? (
            data.data.map((zone) => (
              <TableRow key={zone.id} className="cursor-pointer" onClick={() => setSelected(zone)}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>
                  {zone.city}/{zone.state}
                </TableCell>
                <TableCell className="font-mono text-xs">{zone.slug}</TableCell>
                <TableCell>{zone.neighborhoods.length}</TableCell>
                <TableCell>{zone._count.drivers}</TableCell>
                <TableCell>{zone._count.orders}</TableCell>
                <TableCell>
                  <Badge variant={zone.isActive ? 'success' : 'secondary'}>
                    {zone.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Nenhuma zona encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <ZoneDetailSheet zone={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateZoneDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [neighborhoods, setNeighborhoods] = useState('');

  const reset = () => {
    setCity('');
    setState('');
    setName('');
    setSlug('');
    setNeighborhoods('');
  };

  const mutation = useMutation({
    mutationFn: () =>
      createZone({
        city,
        state,
        name,
        slug,
        neighborhoods: textToNeighborhoods(neighborhoods),
      }),
    onSuccess: () => {
      toast.success('Zona criada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] });
      reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar zona.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova zona</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova zona</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="São Paulo - Centro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="sp-centro" />
          </div>
          <div className="space-y-1.5">
            <Label>Bairros (separe por vírgula)</Label>
            <Textarea
              value={neighborhoods}
              onChange={(e) => setNeighborhoods(e.target.value)}
              placeholder="Sé, República, Bela Vista"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!city || !state || !name || !slug || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Criando...' : 'Criar zona'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ZoneDetailSheet({ zone, onClose }: { zone: ZoneAdmin | null; onClose: () => void }) {
  return (
    <Sheet open={!!zone} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{zone?.name}</SheetTitle>
          <SheetDescription>
            {zone?.city}/{zone?.state} · {zone?.slug}
          </SheetDescription>
        </SheetHeader>

        {/* key={zone.id} forca remount ao trocar de zona selecionada, pra
            resetar o estado local do textarea de bairros corretamente. */}
        {zone && <ZoneDetailContent key={zone.id} zone={zone} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function ZoneDetailContent({ zone, onClose }: { zone: ZoneAdmin; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [neighborhoods, setNeighborhoods] = useState(neighborhoodsToText(zone.neighborhoods));

  const updateMutation = useMutation({
    mutationFn: () => updateZone(zone.id, { neighborhoods: textToNeighborhoods(neighborhoods) }),
    onSuccess: () => {
      toast.success('Bairros atualizados.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar zona.');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateZone(zone.id),
    onSuccess: () => {
      toast.success('Zona desativada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao desativar zona.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => updateZone(zone.id, { isActive: true }),
    onSuccess: () => {
      toast.success('Zona reativada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao reativar zona.');
    },
  });

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Status</p>
          <Badge variant={zone.isActive ? 'success' : 'secondary'}>
            {zone.isActive ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
        <div>
          <p className="text-muted-foreground">Criada em</p>
          <p className="font-medium">{formatDate(zone.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Lavadores na zona</p>
          <p className="font-medium">{zone._count.drivers}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Pedidos na zona</p>
          <p className="font-medium">{zone._count.orders}</p>
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-sm font-medium">Bairros (separe por vírgula)</p>
        <Textarea value={neighborhoods} onChange={(e) => setNeighborhoods(e.target.value)} />
        <Button
          variant="outline"
          className="w-full"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
        >
          {updateMutation.isPending ? 'Salvando...' : 'Salvar bairros'}
        </Button>
      </div>

      <div className="border-t pt-4">
        {zone.isActive ? (
          <Button
            variant="destructive"
            className="w-full"
            disabled={deactivateMutation.isPending}
            onClick={() => deactivateMutation.mutate()}
          >
            {deactivateMutation.isPending ? 'Desativando...' : 'Desativar zona'}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={reactivateMutation.isPending}
            onClick={() => reactivateMutation.mutate()}
          >
            {reactivateMutation.isPending ? 'Reativando...' : 'Reativar zona'}
          </Button>
        )}
      </div>
    </div>
  );
}
