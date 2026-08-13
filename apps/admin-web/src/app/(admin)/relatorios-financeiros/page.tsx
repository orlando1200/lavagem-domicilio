'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { exportPayments, getPaymentsReport, listPayments } from '@/lib/api/payments';
import { downloadCsv, toCsv } from '@/lib/csv';
import { formatCurrencyBRL, formatDateTime } from '@/lib/format';
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusVariant,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { Payment, PaymentMethod, PaymentStatus } from '@/lib/types';

export default function RelatoriosFinanceirosPage() {
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  const [method, setMethod] = useState<PaymentMethod | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const filters = {
    status: status === 'all' ? undefined : status,
    method: method === 'all' ? undefined : method,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    search: search || undefined,
  };

  const { data: report, isLoading: isReportLoading } = useQuery({
    queryKey: ['admin', 'payments', 'report', filters],
    queryFn: () => getPaymentsReport(filters),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'payments', 'list', { ...filters, page }],
    queryFn: () => listPayments({ ...filters, page, limit: 20 }),
  });

  async function handleExport() {
    setIsExporting(true);
    try {
      const rows = await exportPayments(filters);
      const csv = toCsv<Payment>(rows, [
        { header: 'ID', value: (p) => p.id },
        { header: 'Data', value: (p) => p.createdAt },
        { header: 'Cliente', value: (p) => p.user?.name },
        { header: 'Email', value: (p) => p.user?.email },
        { header: 'Método', value: (p) => paymentMethodLabel(p.method) },
        { header: 'Status', value: (p) => paymentStatusLabel(p.status) },
        { header: 'Valor', value: (p) => p.amount },
        { header: 'Cashback usado', value: (p) => p.cashbackUsed },
        { header: 'Referência externa', value: (p) => p.externalRef },
      ]);
      downloadCsv(`pagamentos_${new Date().toISOString().slice(0, 10)}.csv`, csv);
    } catch {
      toast.error('Erro ao exportar pagamentos.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios Financeiros</h1>
          <p className="text-sm text-muted-foreground">Pagamentos por status, método e período.</p>
        </div>
        <Button variant="outline" disabled={isExporting} onClick={handleExport}>
          {isExporting ? 'Exportando...' : 'Exportar CSV'}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as PaymentStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {paymentStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Método</Label>
          <Select
            value={method}
            onValueChange={(v) => {
              setMethod(v as PaymentMethod | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os métodos</SelectItem>
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {paymentMethodLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>De</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Até</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Referência externa</Label>
          <Input
            placeholder="Buscar por referência"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total pago (período filtrado)</CardDescription>
            <CardTitle className="text-2xl">
              {isReportLoading ? '—' : formatCurrencyBRL(report?.totalAmount ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {isReportLoading ? '' : `${report?.totalCount ?? 0} pagamento(s)`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Por status</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {report?.byStatus.map((s) => (
              <Badge key={s.status} variant={paymentStatusVariant(s.status)}>
                {paymentStatusLabel(s.status)}: {formatCurrencyBRL(s.amount)} ({s.count})
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>Por método</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {report?.byMethod.map((m) => (
            <Badge key={m.method} variant="outline">
              {paymentMethodLabel(m.method)}: {formatCurrencyBRL(m.amount)} ({m.count})
            </Badge>
          ))}
        </CardContent>
      </Card>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os pagamentos.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Referência</TableHead>
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
            data.data.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                <TableCell className="font-medium">
                  {payment.user.name}
                  <p className="text-xs text-muted-foreground">{payment.user.email}</p>
                </TableCell>
                <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                <TableCell>
                  <Badge variant={paymentStatusVariant(payment.status)}>
                    {paymentStatusLabel(payment.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrencyBRL(payment.amount)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {payment.externalRef ?? '—'}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum pagamento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
