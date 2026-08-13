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
import { PaginationControls } from '@/components/admin/pagination-controls';
import { listSupportTickets, updateSupportTicketStatus } from '@/lib/api/support';
import { formatDateTime } from '@/lib/format';
import {
  supportTicketStatusLabel,
  supportTicketStatusVariant,
  SUPPORT_TICKET_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { SupportTicket, SupportTicketStatus } from '@/lib/types';

export default function SuportePage() {
  const [status, setStatus] = useState<SupportTicketStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SupportTicket | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'support-tickets', 'list', { status, search, page }],
    queryFn: () =>
      listSupportTickets({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Suporte</h1>
        <p className="text-sm text-muted-foreground">Tickets de suporte abertos por clientes e lavadores.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <Input
            placeholder="Assunto, nome ou e-mail"
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
              setStatus(v as SupportTicketStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {SUPPORT_TICKET_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {supportTicketStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os tickets.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assunto</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.data.length ? (
            data.data.map((ticket) => (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => setSelected(ticket)}
              >
                <TableCell className="font-medium">{ticket.subject}</TableCell>
                <TableCell>{ticket.user.name}</TableCell>
                <TableCell>
                  <Badge variant={supportTicketStatusVariant(ticket.status)}>
                    {supportTicketStatusLabel(ticket.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhum ticket encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <TicketDetailSheet ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function TicketDetailSheet({ ticket, onClose }: { ticket: SupportTicket | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<SupportTicketStatus | ''>('');

  const mutation = useMutation({
    mutationFn: () => updateSupportTicketStatus(ticket!.id, { status: newStatus as SupportTicketStatus }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      setNewStatus('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar status.');
    },
  });

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{ticket?.subject}</SheetTitle>
          <SheetDescription>
            {ticket?.user.name} · {ticket?.user.email}
          </SheetDescription>
        </SheetHeader>

        {ticket && (
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Mensagem</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{ticket.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status atual</p>
                <Badge variant={supportTicketStatusVariant(ticket.status)}>
                  {supportTicketStatusLabel(ticket.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Aberto em</p>
                <p className="font-medium">{formatDateTime(ticket.createdAt)}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Este produto ainda não tem um sistema de resposta/chat para tickets — a única ação
              disponível aqui é atualizar o status. Responder ao usuário precisa ser feito por
              fora (e-mail, telefone).
            </p>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Alterar status</p>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as SupportTicketStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TICKET_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {supportTicketStatusLabel(s)}
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
