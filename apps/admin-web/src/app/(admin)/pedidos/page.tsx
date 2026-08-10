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
import { Textarea } from '@/components/ui/textarea';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { listDriverProfiles } from '@/lib/api/driver-profiles';
import { assignDriver, getOrder, listOrders, updateOrderStatus } from '@/lib/api/orders';
import { formatCurrencyBRL, formatDateTime, truncateId } from '@/lib/format';
import { orderStatusLabel, orderStatusVariant, ORDER_STATUS_OPTIONS } from '@/lib/status-badge';
import type { OrderStatus, ServiceType } from '@/lib/types';

const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  DRY_WASH: 'Lavagem a seco',
  EXPRESS_WASH: 'Lavagem express',
  HEAVY_SERVICE: 'Serviço pesado',
};

export default function PedidosPage() {
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'orders', 'list', { status, search, startDate, endDate, page }],
    queryFn: () =>
      listOrders({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Pedidos de lavagem de todos os clientes.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <Input
            placeholder="Id ou observações"
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
              setStatus(v as OrderStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {orderStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>De</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Até</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os pedidos.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Serviço</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Lavador</TableHead>
            <TableHead>Criado em</TableHead>
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
            data.data.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <TableCell className="font-mono text-xs">{truncateId(order.id)}</TableCell>
                <TableCell className="font-medium">{order.customer.name}</TableCell>
                <TableCell>
                  <Badge variant={orderStatusVariant(order.status)}>
                    {orderStatusLabel(order.status)}
                  </Badge>
                </TableCell>
                <TableCell>{order.serviceType ? SERVICE_TYPE_LABEL[order.serviceType] : '—'}</TableCell>
                <TableCell>{formatCurrencyBRL(order.totalAmount)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {order.driverId ? truncateId(order.driverId) : '—'}
                </TableCell>
                <TableCell>{formatDateTime(order.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                Nenhum pedido encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <OrderDetailSheet orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </div>
  );
}

function OrderDetailSheet({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState('');
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [reason, setReason] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'orders', 'detail', orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
  });

  const { data: activeDrivers } = useQuery({
    queryKey: ['admin', 'driver-profiles', 'active-options'],
    queryFn: () => listDriverProfiles({ status: 'active', limit: 100 }),
    enabled: !!orderId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  const assignMutation = useMutation({
    mutationFn: () => assignDriver(orderId!, driverId),
    onSuccess: () => {
      toast.success('Lavador atribuído.');
      setDriverId('');
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atribuir lavador.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: () => updateOrderStatus(orderId!, { status: newStatus as OrderStatus, reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      setNewStatus('');
      setReason('');
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status.');
    },
  });

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Pedido {orderId ? truncateId(orderId) : ''}</SheetTitle>
          <SheetDescription>{order?.customer.name}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : order ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={orderStatusVariant(order.status)}>
                  {orderStatusLabel(order.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Valor total</p>
                <p className="font-medium">{formatCurrencyBRL(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Serviço</p>
                <p className="font-medium">
                  {order.serviceType ? SERVICE_TYPE_LABEL[order.serviceType] : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Veículo</p>
                <p className="font-medium">
                  {order.vehicle.brand} {order.vehicle.model}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Endereço</p>
                <p className="font-medium">
                  {order.address.street}, {order.address.number} — {order.address.neighborhood},{' '}
                  {order.address.city}/{order.address.state}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Lavador atribuído</p>
                <p className="font-mono text-xs">{order.driverId ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>

            {order.items.length > 0 && (
              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Itens</p>
                <ul className="space-y-1 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>{formatCurrencyBRL(item.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Atribuir lavador manualmente</p>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lavador ativo" />
                </SelectTrigger>
                <SelectContent>
                  {activeDrivers?.data.map((d) => (
                    <SelectItem key={d.userId} value={d.userId}>
                      {d.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full"
                disabled={!driverId || assignMutation.isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending ? 'Atribuindo...' : 'Atribuir lavador'}
              </Button>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Forçar status</p>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {orderStatusLabel(s)}
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
                disabled={!newStatus || statusMutation.isPending}
                onClick={() => statusMutation.mutate()}
              >
                {statusMutation.isPending ? 'Salvando...' : 'Salvar status'}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
