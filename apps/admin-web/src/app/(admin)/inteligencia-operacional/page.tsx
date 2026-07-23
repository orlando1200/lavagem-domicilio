'use client';

import {
  BrainCircuit,
  Bot,
  CalendarSync,
  GraduationCap,
  MapPinned,
  Route,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOperationalDashboardMetrics } from '@/hooks/use-users';
import { formatCurrency } from '@/lib/utils';
import type { OperationalDashboardMetrics, OperationalDemandZone } from '@/types';

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs text-gray-400">{sub}</p>
          </div>
          <div className={`rounded-xl p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDemandTone(score: number) {
  if (score >= 90) return 'bg-red-500';
  if (score >= 75) return 'bg-orange-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-lime-500';
  return 'bg-emerald-500';
}

function getTrendBadge(zone: OperationalDemandZone) {
  if (zone.trend === 'up') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Alta</Badge>;
  }
  if (zone.trend === 'down') {
    return <Badge variant="destructive">Queda</Badge>;
  }
  return <Badge variant="secondary">Estável</Badge>;
}

export default function InteligenciaOperacionalPage() {
  const { data: metrics, isLoading } = useOperationalDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div>
        <Header
          title="Inteligência Operacional"
          subtitle="IA de demanda, rotas, treinamento, WhatsApp e recorrência"
        />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const trainingChart = [
    { name: 'Concluído', value: metrics.trainingProgress.completed, color: '#22c55e' },
    { name: 'Em progresso', value: metrics.trainingProgress.inProgress, color: '#3b82f6' },
    { name: 'Atrasado', value: metrics.trainingProgress.overdue, color: '#ef4444' },
  ];

  return (
    <div>
      <Header
        title="Inteligência Operacional"
        subtitle="IA de demanda, rotas, treinamento, WhatsApp e recorrência"
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Surge médio"
            value={`${metrics.avgSurgeMultiplier.toFixed(2)}x`}
            sub={`Faixa ativa ${metrics.surgeFloor.toFixed(1)}x a ${metrics.surgeCap.toFixed(1)}x`}
            icon={Sparkles}
            color="bg-fuchsia-500"
          />
          <MetricCard
            title="Crescimento previsto"
            value={`${metrics.predictedDemandGrowth.toFixed(1)}%`}
            sub={`${metrics.hotZones} zonas quentes nas próximas horas`}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <MetricCard
            title="Eficiência de rotas"
            value={`${metrics.routeEfficiencyGain.toFixed(0)}%`}
            sub="Economia operacional estimada"
            icon={Route}
            color="bg-blue-500"
          />
          <MetricCard
            title="Receita recorrente"
            value={formatCurrency(metrics.recurringOverview.projectedRevenue)}
            sub={`${metrics.recurringOverview.activeSubscriptions} assinaturas ativas`}
            icon={CalendarSync}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BrainCircuit className="h-4 w-4 text-violet-500" />
                Heatmap preditivo de demanda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={metrics.demandTimeline}>
                  <defs>
                    <linearGradient id="demandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="capacityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                  <XAxis dataKey="window" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="demand"
                    name="Demanda prevista"
                    stroke="#8b5cf6"
                    fill="url(#demandFill)"
                    strokeWidth={2}
                  />
  ],
};

export default function InteligenciaOperacionalPage() {
  const { data: metrics, isLoading } = useOperationalDashboardMetrics();

  const trainingChart = [
    { name: 'Concluído', value: metrics.trainingProgress.completed, color: '#22c55e' },
      <div>
        <Header
          title="Inteligência Operacional"
          subtitle="IA de demanda, rotas, treinamento, WhatsApp e recorrência"
        />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  const trainingChart = [
    { name: 'Concluído', value: metrics.trainingProgress.completed, color: '#22c55e' },
    { name: 'Em progresso', value: metrics.trainingProgress.inProgress, color: '#3b82f6' },
    { name: 'Atrasado', value: metrics.trainingProgress.overdue, color: '#ef4444' },
                    data={trainingChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {trainingChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Taxa de certificação</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {metrics.trainingProgress.certificationRate.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {metrics.trainingProgress.overdue} lavadores precisam concluir módulos críticos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPinned className="h-4 w-4 text-red-500" />
                Zonas com maior pressão operacional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {metrics.demandZones.map((zone) => (
                <div key={zone.zone} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{zone.zone}</h3>
                        {getTrendBadge(zone)}
                      </div>
                      <p className="text-xs text-slate-500">{zone.city}</p>
                    </div>
                    <Badge className={`${getDemandTone(zone.demandScore)} text-white`}>
                      Score {zone.demandScore}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Pedidos previstos</p>
                      <p className="mt-1 font-semibold text-slate-900">{zone.predictedOrders}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Lavadores ativos</p>
                      <p className="mt-1 font-semibold text-slate-900">{zone.activeWashers}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">ETA médio</p>
                      <p className="mt-1 font-semibold text-slate-900">{zone.avgEtaMinutes} min</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Surge sugerido</p>
                      <p className="mt-1 font-semibold text-slate-900">{zone.surgeMultiplier.toFixed(2)}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-4 w-4 text-cyan-500" />
                  Sugestões de roteirização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={metrics.routeSuggestions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="estimatedMinutes" name="Minutos" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="fuelSavingPercent" name="% economia" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-emerald-500" />
                  Bot WhatsApp e recorrência
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Bot WhatsApp</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">
                    {metrics.botOverview.conversationsToday}
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    conversas hoje · {metrics.botOverview.conversionRate.toFixed(1)}% conversão
                  </p>
                  <p className="mt-2 text-xs text-emerald-700">
                    Resposta média de {metrics.botOverview.avgResponseSeconds}s e {metrics.botOverview.recoveredOrders} pedidos recuperados.
                  </p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-orange-700">Recorrência</p>
                  <p className="mt-2 text-2xl font-bold text-orange-900">
                    {metrics.recurringOverview.renewalsThisWeek}
                  </p>
                  <p className="mt-1 text-sm text-orange-800">renovações previstas nesta semana</p>
                  <p className="mt-2 text-xs text-orange-700">
                    {metrics.recurringOverview.churnRiskCount} contas em risco de churn monitoradas pela operação.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="AI Surge"
            value={metrics.aiSurgeEnabled ? 'Ativo' : 'Inativo'}
            sub="Motor de precificação dinâmica"
            icon={Zap}
            color={metrics.aiSurgeEnabled ? 'bg-violet-500' : 'bg-slate-500'}
          />
          <MetricCard
            title="Risco de churn"
            value={metrics.recurringOverview.churnRiskCount.toString()}
            sub="Assinaturas exigindo retenção"
            icon={TrendingDown}
            color="bg-rose-500"
          />
          <MetricCard
            title="Receita recuperada"
            value={formatCurrency(metrics.botOverview.recoveredOrders * 79)}
            sub="Estimativa via automação conversacional"
            icon={Bot}
            color="bg-teal-500"
          />
        </div>
      </div>
    </div>
  );
}

