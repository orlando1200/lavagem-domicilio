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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PaginationControls } from '@/components/admin/pagination-controls';
import {
  getDriverProfile,
  listDriverProfiles,
  updateDriverProfileStatus,
} from '@/lib/api/driver-profiles';
import { formatDate } from '@/lib/format';
import { driverStatusLabel, driverStatusVariant, DRIVER_STATUS_OPTIONS } from '@/lib/status-badge';
import type { DriverStatus, DriverType } from '@/lib/types';

type QuickTab = 'pending_documents' | 'active' | 'blocked' | 'all';

const DRIVER_TYPE_LABEL: Record<DriverType, string> = {
  MOTO_WASHER: 'Moto',
  CAR_WASHER: 'Carro',
  CARWASH_SHOP: 'Loja de Carwash',
};

export default function LavadoresPage() {
  const [tab, setTab] = useState<QuickTab>('pending_documents');
  const [statusOverride, setStatusOverride] = useState<DriverStatus | 'all'>('all');
  const [driverType, setDriverType] = useState<DriverType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const status: DriverStatus | undefined =
    tab === 'all' ? (statusOverride === 'all' ? undefined : statusOverride) : tab;

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'admin',
      'driver-profiles',
      'list',
      { status, driverType, search, page },
    ],
    queryFn: () =>
      listDriverProfiles({
        status,
        driverType: driverType === 'all' ? undefined : driverType,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Aprovação de Lavadores</h1>
        <p className="text-sm text-muted-foreground">
          Perfis de motorista/loja (moto, carro, loja de carwash) e seus status.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as QuickTab);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="pending_documents">Pendentes</TabsTrigger>
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <Input
            placeholder="Nome ou e-mail"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56"
          />
        </div>
        {tab === 'all' && (
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={statusOverride}
              onValueChange={(v) => {
                setStatusOverride(v as DriverStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {DRIVER_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {driverStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label>Tipo</Label>
          <Select
            value={driverType}
            onValueChange={(v) => {
              setDriverType(v as DriverType | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(DRIVER_TYPE_LABEL) as DriverType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {DRIVER_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar os perfis.</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Zona</TableHead>
            <TableHead>Criado em</TableHead>
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
            data.data.map((profile) => (
              <TableRow
                key={profile.userId}
                className="cursor-pointer"
                onClick={() => setSelectedUserId(profile.userId)}
              >
                <TableCell className="font-medium">{profile.user.name}</TableCell>
                <TableCell>{profile.user.email}</TableCell>
                <TableCell>{DRIVER_TYPE_LABEL[profile.driverType]}</TableCell>
                <TableCell>
                  <Badge variant={driverStatusVariant(profile.status)}>
                    {driverStatusLabel(profile.status)}
                  </Badge>
                </TableCell>
                <TableCell>{profile.zone?.name ?? '—'}</TableCell>
                <TableCell>{formatDate(profile.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum perfil encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <DriverProfileDetailSheet
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </div>
  );
}

function DriverProfileDetailSheet({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<DriverStatus | ''>('');
  const [reason, setReason] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'detail', userId],
    queryFn: () => getDriverProfile(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      updateDriverProfileStatus(userId!, {
        status: newStatus as DriverStatus,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'driver-profiles'] });
      setNewStatus('');
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status.');
    },
  });

  return (
    <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{profile?.user.name ?? 'Perfil'}</SheetTitle>
          <SheetDescription>{profile?.user.email}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : profile ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">{DRIVER_TYPE_LABEL[profile.driverType]}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status atual</p>
                <Badge variant={driverStatusVariant(profile.status)}>
                  {driverStatusLabel(profile.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{profile.user.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Zona</p>
                <p className="font-medium">{profile.zone?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Raio de atendimento</p>
                <p className="font-medium">{profile.serviceRadiusKm} km</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Alterar status</p>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DriverStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {DRIVER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {driverStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Motivo (opcional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                className="w-full"
                disabled={!newStatus || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar status'}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
