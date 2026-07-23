'use client';

import { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  ShoppingCart,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';






















  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function MetricCard({
  title,
  value,
  sub,


























export default function RelatoriosPage() {
  const [period, setPeriod] = useState('year');
  const { data: report, isLoading, refetch, isFetching } = useFinancialReport(period);

  return (
    <div>
    return (
      <div>
        <Header title="Relatórios Financeiros" subtitle="Análise de faturamento e repasses" />
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Relatórios Financeiros" subtitle="Análise de faturamento e repasses" />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Select value={period} onValueChange={setPeriod}>
