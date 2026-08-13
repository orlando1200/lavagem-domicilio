'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { expireOverdueLoyalty, getLoyaltyReport, grantLoyaltyForOrder } from '@/lib/api/loyalty';
import { formatCurrencyBRL } from '@/lib/format';

export default function FidelidadePage() {
  const [topLimit, setTopLimit] = useState('10');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'loyalty', 'report', { topLimit }],
    queryFn: () => getLoyaltyReport(Number(topLimit) || 10),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Fidelidade</h1>
        <p className="text-sm text-muted-foreground">Relatório do programa de pontos GIUCAR.</p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar o relatório.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          title="Concedido"
          points={data?.totalGranted}
          value={data?.totalGrantedValue}
          isLoading={isLoading}
        />
        <ReportCard
          title="Resgatado"
          points={data?.totalRedeemed}
          value={data?.totalRedeemedValue}
          isLoading={isLoading}
        />
        <ReportCard
          title="Em aberto"
          points={data?.totalOutstanding}
          value={data?.totalOutstandingValue}
          isLoading={isLoading}
        />
        <ReportCard
          title="Expirado"
          points={data?.totalExpired}
          value={data?.totalExpiredValue}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Top usuários por saldo</CardTitle>
            <CardDescription>Maiores saldos de pontos em aberto (não expirados).</CardDescription>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Quantidade</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={topLimit}
              onChange={(e) => setTopLimit(e.target.value)}
              className="w-20"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Saldo (pontos)</TableHead>
                <TableHead>Saldo (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data?.topHolders.length ? (
                data.topHolders.map((holder) => (
                  <TableRow key={holder.userId}>
                    <TableCell className="font-medium">
                      {holder.userName}
                      <p className="text-xs text-muted-foreground">{holder.userEmail}</p>
                    </TableCell>
                    <TableCell>{holder.balance}</TableCell>
                    <TableCell>{formatCurrencyBRL(holder.balanceValue)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Nenhum saldo em aberto.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ExpireOverdueCard />
        <GrantForOrderCard />
      </div>
    </div>
  );
}

function ReportCard({
  title,
  points,
  value,
  isLoading,
}: {
  title: string;
  points: number | undefined;
  value: number | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">
          {isLoading ? '—' : `${points ?? 0} pts`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isLoading ? '' : formatCurrencyBRL(value ?? 0)}
        </p>
      </CardContent>
    </Card>
  );
}

function ExpireOverdueCard() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: expireOverdueLoyalty,
    onSuccess: (result) => {
      toast.success(`${result.expiredCount} concessão(ões) vencida(s) expirada(s).`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty', 'report'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao expirar pontos.');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expirar pontos vencidos</CardTitle>
        <CardDescription>
          Roda a mesma rotina do job noturno agora — marca concessões com validade vencida como
          finalizadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Expirando...' : 'Expirar pontos vencidos'}
        </Button>
      </CardContent>
    </Card>
  );
}

function GrantForOrderCard() {
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState('');

  const mutation = useMutation({
    mutationFn: () => grantLoyaltyForOrder(orderId),
    onSuccess: () => {
      toast.success('Pontos concedidos para o pedido.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty', 'report'] });
      setOrderId('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao conceder pontos (o pedido já pode ter pontos concedidos).');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conceder pontos manualmente</CardTitle>
        <CardDescription>
          Concede 5% do valor de um pedido em pontos GIUCAR. Falha se o pedido já tiver pontos
          concedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input
          placeholder="Id do pedido"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <Button disabled={!orderId || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Concedendo...' : 'Conceder'}
        </Button>
      </CardContent>
    </Card>
  );
}
