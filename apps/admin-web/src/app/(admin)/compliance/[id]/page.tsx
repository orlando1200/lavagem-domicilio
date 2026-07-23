'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  User,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  useOnboarding,
  useApproveOnboarding,
  useRejectOnboarding,
  useReviewDocument,
} from '@/hooks/use-compliance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import {
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_COLORS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_COLORS,
  type WasherOnboarding,
  type WasherDocument,
  type DocumentType,
} from '@/types';

const DOC_TYPES_ORDER: DocumentType[] = ['cnh', 'rg', 'cpf', 'selfie', 'background_check'];

export default function ComplianceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [docRejectDialogOpen, setDocRejectDialogOpen] = useState(false);
  const [docRejectReason, setDocRejectReason] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<WasherDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<WasherDocument | null>(null);

  const { data: onboarding, isLoading } = useOnboarding(id);
  const approveMutation = useApproveOnboarding();
  const rejectMutation = useRejectOnboarding();
  const reviewDocMutation = useReviewDocument();

  async function handleApprove() {
    try {
      await approveMutation.mutateAsync(id);
      toast({ title: 'Lavador aprovado — aguardando envio do kit inicial' });
    } catch {
      toast({ title: 'Erro ao aprovar lavador', variant: 'destructive' });
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast({ title: 'Informe o motivo da rejeição', variant: 'destructive' });
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      toast({ title: 'Lavador reprovado' });
      setRejectDialogOpen(false);
      setRejectReason('');
    } catch {
      toast({ title: 'Erro ao reprovar lavador', variant: 'destructive' });
    }
  }

  async function handleApproveDoc(doc: WasherDocument) {
    try {
      await reviewDocMutation.mutateAsync({
        onboardingId: id,
        documentId: doc.id,
        status: 'approved',
      });
      toast({ title: `${DOCUMENT_TYPE_LABELS[doc.type]} aprovado` });
    } catch {
      toast({ title: 'Erro ao aprovar documento', variant: 'destructive' });
    }
  }

  function openDocReject(doc: WasherDocument) {
    setSelectedDoc(doc);
    setDocRejectReason('');
    setDocRejectDialogOpen(true);
  }

  async function handleRejectDoc() {
    if (!selectedDoc) return;
    if (!docRejectReason.trim()) {
      toast({ title: 'Informe o motivo', variant: 'destructive' });
      return;
    }
    try {
      await reviewDocMutation.mutateAsync({
        onboardingId: id,
        documentId: selectedDoc.id,
        status: 'rejected',
        reason: docRejectReason,
      });
      toast({ title: `${DOCUMENT_TYPE_LABELS[selectedDoc.type]} reprovado` });
      setDocRejectDialogOpen(false);
      setSelectedDoc(null);
    } catch {
      toast({ title: 'Erro ao reprovar documento', variant: 'destructive' });
    }
  }

  if (isLoading || !onboarding) {
    return (
      <div>
        <Header title="Detalhe de Onboarding" subtitle="Carregando..." />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const canDecide =
    onboarding.status === 'pending' || onboarding.status === 'under_review';

  const sortedDocs = [...onboarding.documents].sort(
    (a, b) => DOC_TYPES_ORDER.indexOf(a.type) - DOC_TYPES_ORDER.indexOf(b.type)
  );

  return (
    <div>
      <Header
        title="Detalhe de Onboarding"
        subtitle={onboarding.washer.user.name}
      />

      <div className="p-6">
        {/* Back + Actions bar */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push('/compliance')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          {canDecide && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4" />
                Reprovar Lavador
              </Button>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprovar → Aguardar Kit
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Washer info */}
          <div className="space-y-4">
            {/* Profile card */}
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                  {onboarding.washer.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {onboarding.washer.user.name}
                  </p>
                  <Badge variant={ONBOARDING_STATUS_COLORS[onboarding.status]}>
                    {ONBOARDING_STATUS_LABELS[onboarding.status]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <InfoRow icon={<Mail className="h-4 w-4" />} value={onboarding.washer.user.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} value={onboarding.washer.user.phone ?? '—'} />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Enviado em"
                  value={formatDate(onboarding.submittedAt)}
                />
                {onboarding.reviewedAt && (
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Revisado em"
                    value={formatDate(onboarding.reviewedAt)}
                  />
                )}
              </div>
            </Card>

            {/* Rejection reason */}
            {onboarding.status === 'rejected' && onboarding.rejectionReason && (
              <Card className="border-red-200 bg-red-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                  Motivo da reprovação
                </p>
                <p className="text-sm text-red-800">{onboarding.rejectionReason}</p>
              </Card>
            )}

            {/* Background check */}
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-gray-700">Antecedentes Criminais</p>
              {onboarding.backgroundCheckStatus ? (
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      onboarding.backgroundCheckStatus === 'approved'
                        ? 'success'
                        : onboarding.backgroundCheckStatus === 'rejected'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {onboarding.backgroundCheckStatus === 'approved'
                      ? 'Aprovado'
                      : onboarding.backgroundCheckStatus === 'rejected'
                      ? 'Reprovado'
                      : 'Pendente'}
                  </Badge>
                  {onboarding.backgroundCheckUrl && (
                    <a
                      href={onboarding.backgroundCheckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      Ver laudo <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Não enviado</p>
              )}
            </Card>
          </div>

          {/* Right: Documents */}
          <div className="lg:col-span-2">
            <Tabs defaultValue={sortedDocs[0]?.type ?? 'cnh'} className="space-y-4">
              <TabsList className="flex-wrap bg-gray-100 h-auto gap-1">
                {sortedDocs.map((doc) => (
                  <TabsTrigger key={doc.id} value={doc.type} className="gap-1.5">
                    {DOCUMENT_TYPE_LABELS[doc.type]}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        doc.status === 'approved'
                          ? 'bg-green-500'
                          : doc.status === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                  </TabsTrigger>
                ))}
              </TabsList>

              {sortedDocs.map((doc) => (
                <TabsContent key={doc.id} value={doc.type}>
                  <Card className="overflow-hidden">
                    {/* Doc header */}
                    <div className="flex items-center justify-between border-b px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-800">
                          {DOCUMENT_TYPE_LABELS[doc.type]}
                        </span>
                        <Badge variant={DOCUMENT_STATUS_COLORS[doc.status]}>
                          {DOCUMENT_STATUS_LABELS[doc.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        {doc.status !== 'approved' && canDecide && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveDoc(doc)}
                            disabled={reviewDocMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprovar
                          </Button>
                        )}
                        {doc.status !== 'rejected' && canDecide && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => openDocReject(doc)}
                            disabled={reviewDocMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reprovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Ampliar
                        </Button>
                      </div>
                    </div>

                    {/* Doc image */}
                    <div className="flex items-center justify-center bg-gray-50 p-4 min-h-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.url}
                        alt={DOCUMENT_TYPE_LABELS[doc.type]}
                        className="max-h-80 max-w-full rounded-lg object-contain shadow"
                      />
                    </div>

                    {/* Rejection reason */}
                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <div className="border-t bg-red-50 px-5 py-3">
                        <p className="text-xs font-semibold text-red-600">Motivo da reprovação</p>
                        <p className="text-sm text-red-800">{doc.rejectionReason}</p>
                      </div>
                    )}

                    {/* Review date */}
                    {doc.reviewedAt && (
                      <div className="border-t px-5 py-2 text-xs text-gray-400">
                        Revisado em {formatDate(doc.reviewedAt)}
                      </div>
                    )}
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>

      {/* ── Reject Onboarding Dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar lavador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Informe o motivo da reprovação. O lavador receberá essa mensagem para corrigir os
              documentos.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reject-reason">Motivo *</Label>
              <textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Descreva o motivo da reprovação..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              className="gap-2"
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Document Dialog ── */}
      <Dialog open={docRejectDialogOpen} onOpenChange={setDocRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Reprovar {selectedDoc ? DOCUMENT_TYPE_LABELS[selectedDoc.type] : 'documento'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="doc-reject-reason">Motivo *</Label>
              <textarea
                id="doc-reject-reason"
                rows={3}
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="Ex: Documento ilegível, foto com baixa qualidade..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectDoc}
              disabled={reviewDocMutation.isPending || !docRejectReason.trim()}
              className="gap-2"
            >
              {reviewDocMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Preview Dialog ── */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewDoc ? DOCUMENT_TYPE_LABELS[previewDoc.type] : ''}
            </DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDoc.url}
                alt={DOCUMENT_TYPE_LABELS[previewDoc.type]}
                className="max-h-[70vh] max-w-full rounded object-contain"
              />
            </div>
          )}
          <DialogFooter>
            {previewDoc && (
              <a href={previewDoc.url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Abrir original
                </Button>
              </a>
            )}
            <Button onClick={() => setPreviewDoc(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label?: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-400">{icon}</span>
      {label && <span className="text-gray-400">{label}:</span>}
      <span>{value}</span>
    </div>
  );
}

