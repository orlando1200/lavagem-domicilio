'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useOnboardings, useComplianceMetrics } from '@/hooks/use-compliance';
import { formatDate } from '@/lib/utils';
import {
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_COLORS,
  type OnboardingStatus,
  type WasherOnboarding,
} from '@/types';

const ALL_STATUSES: OnboardingStatus[] = ['pending', 'under_review', 'approved', 'rejected', 'awaiting_kit'];

function docsApproved(onboarding: WasherOnboarding) {
  return onboarding.documents.filter((d) => d.status === 'approved').length;
}

export default function CompliancePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('onboarding');

  const { data, isLoading, refetch, isFetching } = useOnboardings(page, 20, {
    status: statusFilter,
    search,
  });
  const { data: metrics } = useComplianceMetrics();

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value === 'all' ? '' : (value as OnboardingStatus));
    setPage(1);
  }, []);

  return (
    <div>
      <Header title="Compliance" subtitle="Onboarding e verificação de lavadores" />

      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="onboarding">Onboarding Lavadores</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          {/* ─── ONBOARDING TAB ─── */}
          <TabsContent value="onboarding">
            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {data?.total ?? 0} lavadores encontrados
              </div>
              <div className="flex flex-1 gap-2 sm:max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou e-mail..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-9"
                  />
                </div>
                <Select onValueChange={handleStatusFilter} defaultValue="all">
                  <SelectTrigger className="w-44">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ONBOARDING_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Atualizar"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lavador</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Antecedentes</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : !data?.data.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                        Nenhum lavador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((onboarding) => (
                      <TableRow
                        key={onboarding.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/compliance/${onboarding.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {onboarding.washer.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{onboarding.washer.user.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs text-gray-500">{onboarding.washer.user.email}</p>
                            <p className="text-xs text-gray-400">{onboarding.washer.user.phone ?? '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {docsApproved(onboarding)}/{onboarding.documents.length} aprovados
                          </span>
                        </TableCell>
                        <TableCell>
                          {onboarding.backgroundCheckStatus ? (
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
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(onboarding.submittedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={ONBOARDING_STATUS_COLORS[onboarding.status]}>
                            {ONBOARDING_STATUS_LABELS[onboarding.status]}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalhes"
                            onClick={() => router.push(`/compliance/${onboarding.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm text-gray-600">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ─── DASHBOARD TAB ─── */}
          <TabsContent value="dashboard">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                icon={<ShieldCheck className="h-5 w-5 text-blue-600" />}
                label="Total de cadastros"
                value={metrics?.total ?? 0}
                bg="bg-blue-50"
              />
              <MetricCard
                icon={<Clock className="h-5 w-5 text-yellow-600" />}
                label="Pendentes"
                value={(metrics?.pending ?? 0) + (metrics?.underReview ?? 0)}
                bg="bg-yellow-50"
                sub={`${metrics?.pending ?? 0} aguardando · ${metrics?.underReview ?? 0} em análise`}
              />
              <MetricCard
                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                label="Aprovados"
                value={metrics?.approved ?? 0}
                bg="bg-green-50"
                sub={`Taxa de aprovação: ${metrics?.approvalRate ?? 0}%`}
              />
              <MetricCard
                icon={<XCircle className="h-5 w-5 text-red-500" />}
                label="Reprovados"
                value={metrics?.rejected ?? 0}
                bg="bg-red-50"
              />
              <MetricCard
                icon={<Package className="h-5 w-5 text-orange-500" />}
                label="Aguardando Kit"
                value={metrics?.awaitingKit ?? 0}
                bg="bg-orange-50"
                sub="aprovados aguardando envio do kit"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Documentos Verificados</h3>
                <p className="text-3xl font-bold text-gray-900">{metrics?.documentsVerified ?? 0}</p>
                <p className="mt-1 text-sm text-gray-500">documentos revisados no total</p>
              </Card>
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-700">Verificação de Antecedentes</h3>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-bold text-green-700">{metrics?.backgroundChecksApproved ?? 0}</p>
                    <p className="text-xs text-gray-500">aprovados</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{metrics?.backgroundChecksRejected ?? 0}</p>
                    <p className="text-xs text-gray-500">reprovados</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Status breakdown */}
            <Card className="mt-4 p-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">Distribuição por Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pendente', value: metrics?.pending ?? 0, color: 'bg-yellow-400' },
                  { label: 'Em análise', value: metrics?.underReview ?? 0, color: 'bg-blue-400' },
                  { label: 'Aprovado', value: metrics?.approved ?? 0, color: 'bg-green-500' },
                  { label: 'Aguardando Kit', value: metrics?.awaitingKit ?? 0, color: 'bg-orange-400' },
                  { label: 'Reprovado', value: metrics?.rejected ?? 0, color: 'bg-red-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-28 text-sm text-gray-600">{label}</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-gray-100 h-2">
                      <div
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${metrics?.total ? (value / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  bg,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
      </div>
    </Card>
  );
}

