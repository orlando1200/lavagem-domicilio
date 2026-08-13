'use client';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardSummary } from '@/lib/api/dashboard';
import { formatCurrencyBRL } from '@/lib/format';
import { orderStatusLabel, orderStatusVariant } from '@/lib/status-badge';

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: getDashboardSummary,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumo operacional em tempo real.</p>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar o resumo.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Receita paga (total)"
          value={isLoading ? '—' : formatCurrencyBRL(data?.revenue.totalPaidAmount ?? 0)}
          caption={isLoading ? '' : `${data?.revenue.totalPaidCount ?? 0} pagamentos`}
        />
        <SummaryCard
          title="Receita paga (hoje)"
          value={isLoading ? '—' : formatCurrencyBRL(data?.revenue.todayPaidAmount ?? 0)}
          caption={isLoading ? '' : `${data?.revenue.todayPaidCount ?? 0} pagamentos hoje`}
        />
        <SummaryCard
          title="Novos clientes hoje"
          value={isLoading ? '—' : String(data?.newClientsToday ?? 0)}
        />
        <SummaryCard
          title="Lavadores ativos"
          value={isLoading ? '—' : String(data?.activeDrivers ?? 0)}
        />
        <SummaryCard
          title="Lojas ativas"
          value={isLoading ? '—' : String(data?.activeStores ?? 0)}
        />
        <SummaryCard
          title="Aprovações pendentes"
          value={isLoading ? '—' : String(data?.pendingDriverApprovals ?? 0)}
          caption="Lavadores com documentos pendentes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por status</CardTitle>
          <CardDescription>Contagem total de pedidos, em todos os períodos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : data?.ordersByStatus.length ? (
            <div className="flex flex-wrap gap-3">
              {data.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <Badge variant={orderStatusVariant(item.status)}>
                    {orderStatusLabel(item.status)}
                  </Badge>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: string;
  caption?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {caption && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </CardContent>
      )}
    </Card>
  );
}
