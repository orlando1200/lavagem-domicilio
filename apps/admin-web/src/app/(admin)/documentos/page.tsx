'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  getDocumentVerification,
  listDocumentVerifications,
  reviewDocumentVerification,
} from '@/lib/api/document-verification';
import { updateDriverProfileStatus } from '@/lib/api/driver-profiles';
import { formatDateTime } from '@/lib/format';
import {
  documentVerificationStatusLabel,
  documentVerificationStatusVariant,
  DOCUMENT_VERIFICATION_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { DocumentVerificationStatus } from '@/lib/types';

export default function DocumentosPage() {
  const [status, setStatus] = useState<DocumentVerificationStatus | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'document-verification', 'list', { status, search, page }],
    queryFn: () =>
      listDocumentVerifications({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Aprovação de documentos enviados pelos lavadores.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as DocumentVerificationStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {DOCUMENT_VERIFICATION_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {documentVerificationStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <Input
            placeholder="Nome, e-mail ou tipo de documento"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar os documentos.</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lavador</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enviado em</TableHead>
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
            data.data.map((doc) => (
              <TableRow
                key={doc.id}
                className="cursor-pointer"
                onClick={() => setSelectedId(doc.id)}
              >
                <TableCell className="font-medium">
                  {doc.user.name}
                  <p className="text-xs text-muted-foreground">{doc.user.email}</p>
                </TableCell>
                <TableCell>{doc.docType}</TableCell>
                <TableCell>
                  <Badge variant={documentVerificationStatusVariant(doc.status)}>
                    {documentVerificationStatusLabel(doc.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(doc.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <DocumentDetailSheet documentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function DocumentDetailSheet({
  documentId,
  onClose,
}: {
  documentId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: doc, isLoading } = useQuery({
    queryKey: ['admin', 'document-verification', 'detail', documentId],
    queryFn: () => getDocumentVerification(documentId!),
    enabled: !!documentId,
  });

  const reviewMutation = useMutation({
    mutationFn: (newStatus: 'approved' | 'rejected') =>
      reviewDocumentVerification(documentId!, newStatus, rejectionReason),
    onSuccess: () => {
      toast.success('Documento revisado.');
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'document-verification'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao revisar documento.');
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => updateDriverProfileStatus(doc!.userId, { status: 'active' }),
    onSuccess: () => {
      toast.success('Lavador ativado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'driver-profiles'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao ativar lavador.');
    },
  });

  return (
    <Sheet open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{doc?.user.name ?? 'Documento'}</SheetTitle>
          <SheetDescription>{doc?.user.email}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : doc ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo de documento</p>
                <p className="font-medium">{doc.docType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status atual</p>
                <Badge variant={documentVerificationStatusVariant(doc.status)}>
                  {documentVerificationStatusLabel(doc.status)}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{doc.user.phone ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Enviado em</p>
                <p className="font-medium">{formatDateTime(doc.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Arquivo</p>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-sm text-primary underline"
              >
                {doc.fileUrl}
              </a>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Revisar documento</p>
              {doc.status === 'rejected' && doc.rejectionReason && (
                <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                  Motivo da rejeição: {doc.rejectionReason}
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Motivo da rejeição (obrigatório para rejeitar)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex.: foto ilegível, documento vencido..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={doc.status === 'approved' || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate('approved')}
                >
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={doc.status === 'rejected' || !rejectionReason || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate('rejected')}
                >
                  Rejeitar
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">Ativação do lavador</p>
              <p className="text-xs text-muted-foreground">
                Decisão manual do admin — não depende de quantos documentos foram aprovados.
                Move o perfil do lavador para o status &quot;Ativo&quot;, permitindo que ele
                receba pedidos.
              </p>
              <Button
                variant="outline"
                className="w-full"
                disabled={activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
              >
                {activateMutation.isPending ? 'Ativando...' : 'Ativar lavador'}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
