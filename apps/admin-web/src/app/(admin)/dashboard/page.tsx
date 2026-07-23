'use client';

import {
  TrendingUp,
  Users,
  Car,
  ShoppingCart,
  DollarSign,
  Clock,
  Star,
  Activity,
  CheckCircle2,
  Target,
  UserCheck,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { useDashboardMetrics } from '@/hooks/use-users';
import { formatCurrency } from '@/lib/utils';
import type { DashboardMetrics } from '@/types';
import {
  LineChart,
  Line,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'];

function MetricCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
          </div>
          <div className={`rounded-xl p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Visão geral do marketplace" />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do marketplace" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pedidos Hoje"
            value={metrics.ordersToday}
            sub={`${metrics.totalOrders.toLocaleString('pt-BR')} total`}
            icon={ShoppingCart}
            color="bg-blue-500"
          />
          <MetricCard
            title="Receita Hoje"
            value={formatCurrency(metrics.revenueToday)}
            sub={`${formatCurrency(metrics.totalRevenue)} total`}
            icon={DollarSign}
            color="bg-green-500"
          />
          <MetricCard
            title="Usuários"
  ],
};

export default function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  if (isLoading || !metrics) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Visão geral do marketplace" />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do marketplace" />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pedidos Hoje"
            sub="Receita média por pedido"
            icon={Target}
            color="bg-cyan-500"
          />
          <MetricCard
            title="Conversão"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            sub={`${metrics.activeUsersToday.toLocaleString('pt-BR')} usuários ativos hoje`}
            icon={UserCheck}
            color="bg-violet-500"
          />
          <MetricCard
            title="Avaliação Média"
            value={`${metrics.averageRating.toFixed(1)} ★`}
            sub="Experiência média dos clientes"
            icon={Star}
            color="bg-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Receita (últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={metrics.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-blue-500" />
                Pedidos (últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.ordersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-yellow-500" />
                Distribuição por status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics.statusChart}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {metrics.statusChart.map((_, index) => (
                      <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
                Serviços com maior receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={metrics.topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatCurrency(value) : value
                    }
                  />
                  <Bar dataKey="revenue" name="Receita" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Pedidos Pendentes"
            value={metrics.pendingOrders}
            sub="Demandas aguardando operação"
            icon={Clock}
            color="bg-yellow-500"
          />
          <MetricCard
            title="Total de Pedidos"
            value={metrics.totalOrders.toLocaleString('pt-BR')}
            sub="Base histórica acumulada"
            icon={ShoppingCart}
            color="bg-indigo-500"
          />
          <MetricCard
            title="Receita Acumulada"
            value={formatCurrency(metrics.totalRevenue)}
            sub="Volume bruto processado"
            icon={DollarSign}
            color="bg-slate-700"
          />
        </div>
      </div>
    </div>
  );
}

