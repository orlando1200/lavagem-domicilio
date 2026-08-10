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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PaginationControls } from '@/components/admin/pagination-controls';
import { listProducts, listStores, updateProductStatus } from '@/lib/api/marketplace';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import {
  productStatusLabel,
  productStatusVariant,
  storeStatusLabel,
  storeStatusVariant,
  PRODUCT_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { Product, ProductStatus } from '@/lib/types';

export default function MarketplacePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Marketplace</h1>
        <p className="text-sm text-muted-foreground">Lojas cadastradas e aprovação de produtos.</p>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="lojas">Lojas</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="lojas">
          <StoresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StoresTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'marketplace', 'stores'],
    queryFn: listStores,
  });

  return (
    <div className="mt-4 space-y-4">
      {isError && <p className="text-sm text-destructive">Não foi possível carregar as lojas.</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Plano logístico</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Produtos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.length ? (
            data.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.storeType === 'LAVADOR' ? 'Vende p/ lavador' : 'Vende p/ cliente'}</TableCell>
                <TableCell>{store.logisticsPlan === 'INTEGRATED' ? 'Integrada' : 'Própria'}</TableCell>
                <TableCell>
                  <Badge variant={storeStatusVariant(store.status)}>
                    {storeStatusLabel(store.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {store.commissionPlan
                    ? `${(Number(store.commissionPlan.takeRate) * 100).toFixed(0)}% + ${formatCurrencyBRL(store.commissionPlan.monthlyFee)}/mês`
                    : '—'}
                </TableCell>
                <TableCell>{store._count.products}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhuma loja encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ProductsTab() {
  const [status, setStatus] = useState<ProductStatus | 'all'>('pending_approval');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'marketplace', 'products', { status, search, page }],
    queryFn: () =>
      listProducts({
        status: status === 'all' ? undefined : status,
        search: search || undefined,
        page,
        limit: 20,
      }),
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Buscar</Label>
          <Input
            placeholder="Nome do produto"
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
              setStatus(v as ProductStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {PRODUCT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {productStatusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os produtos.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Loja</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
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
            data.data.map((product) => (
              <TableRow
                key={product.id}
                className="cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.store.name}</TableCell>
                <TableCell>{formatCurrencyBRL(product.price)}</TableCell>
                <TableCell>{product.category ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={productStatusVariant(product.status)}>
                    {productStatusLabel(product.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(product.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <ProductStatusDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}

function ProductStatusDialog({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  const mutation = useMutation({
    mutationFn: (status: 'active' | 'rejected') =>
      updateProductStatus(product!.id, {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      }),
    onSuccess: () => {
      toast.success('Status do produto atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'products'] });
      setRejectionReason('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar produto.');
    },
  });

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>
            {product?.store.name} · {product ? formatCurrencyBRL(product.price) : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Motivo da rejeição (obrigatório para rejeitar)</Label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ex.: descrição incompleta, produto proibido..."
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!rejectionReason || mutation.isPending}
            onClick={() => mutation.mutate('rejected')}
          >
            Rejeitar
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate('active')}>
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
