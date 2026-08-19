'use client';

import { useEffect, useState } from 'react';
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
import {
  importFitmentsCsv,
  listProductFitments,
  listProducts,
  listStores,
  replaceProductFitments,
  updateProductStatus,
  updateStoreStatus,
  type FitmentImportResult,
  type FitmentRuleBody,
} from '@/lib/api/marketplace';
import { listVehicleBrands, listVehicleCatalogModels } from '@/lib/api/vehicle-catalog';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import {
  productStatusLabel,
  productStatusVariant,
  storeStatusLabel,
  storeStatusVariant,
  PRODUCT_STATUS_OPTIONS,
  STORE_STATUS_OPTIONS,
} from '@/lib/status-badge';
import type { Product, ProductStatus, Store, StoreStatus } from '@/lib/types';

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
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
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
              <TableRow
                key={store.id}
                className="cursor-pointer"
                onClick={() => setSelectedStore(store)}
              >
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

      <StoreStatusDialog store={selectedStore} onClose={() => setSelectedStore(null)} />
    </div>
  );
}

function StoreStatusDialog({ store, onClose }: { store: Store | null; onClose: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status: StoreStatus) => updateStoreStatus(store!.id, status),
    onSuccess: () => {
      toast.success('Status da loja atualizado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'stores'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao atualizar loja.');
    },
  });

  return (
    <Dialog open={!!store} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{store?.name}</DialogTitle>
          <DialogDescription>
            {store ? (store.storeType === 'LAVADOR' ? 'Vende p/ lavador' : 'Vende p/ cliente') : ''} · Status
            atual:{' '}
            {store && (
              <Badge variant={storeStatusVariant(store.status)}>{storeStatusLabel(store.status)}</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Novo status</Label>
          <div className="flex flex-wrap gap-2">
            {STORE_STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={store?.status === s ? 'default' : 'outline'}
                disabled={mutation.isPending || store?.status === s}
                onClick={() => mutation.mutate(s)}
              >
                {storeStatusLabel(s)}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductsTab() {
  const [status, setStatus] = useState<ProductStatus | 'all'>('pending_approval');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fitmentProduct, setFitmentProduct] = useState<Product | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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
      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          Importar compatibilidade (CSV)
        </Button>
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
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitmentProduct(product);
                    }}
                  >
                    Compatibilidade
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
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
      <FitmentDialog product={fitmentProduct} onClose={() => setFitmentProduct(null)} />
      <ImportFitmentsDialog open={importOpen} onOpenChange={setImportOpen} />
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

type FitmentRow = {
  key: string;
  universal: boolean;
  brandId: string;
  modelId: string;
  yearFrom: string;
  yearTo: string;
};

const emptyRow = (): FitmentRow => ({
  key: crypto.randomUUID(),
  universal: false,
  brandId: '',
  modelId: '',
  yearFrom: '',
  yearTo: '',
});

function FitmentDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<FitmentRow[]>([]);

  const { data: brands } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'brands'],
    queryFn: listVehicleBrands,
    enabled: !!product,
  });
  const { data: models } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'models'],
    queryFn: () => listVehicleCatalogModels(),
    enabled: !!product,
  });
  const { data: fitments } = useQuery({
    queryKey: ['admin', 'marketplace', 'products', product?.id, 'fitments'],
    queryFn: () => listProductFitments(product!.id),
    enabled: !!product,
  });

  useEffect(() => {
    if (!fitments) return;
    setRows(
      fitments.length
        ? fitments.map((f) => ({
            key: f.id,
            universal: f.universal,
            brandId: f.brandId ?? '',
            modelId: f.modelId ?? '',
            yearFrom: f.yearFrom ? String(f.yearFrom) : '',
            yearTo: f.yearTo ? String(f.yearTo) : '',
          }))
        : [],
    );
  }, [fitments]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const body: FitmentRuleBody[] = rows.map((row) =>
        row.universal
          ? { universal: true }
          : {
              universal: false,
              brandId: row.brandId || undefined,
              modelId: row.modelId || undefined,
              yearFrom: row.yearFrom ? Number(row.yearFrom) : undefined,
              yearTo: row.yearTo ? Number(row.yearTo) : undefined,
            },
      );
      return replaceProductFitments(product!.id, body);
    },
    onSuccess: () => {
      toast.success('Compatibilidade salva.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'products', product?.id, 'fitments'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao salvar compatibilidade.'),
  });

  const updateRow = (key: string, patch: Partial<FitmentRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const canSave = rows.every((r) => r.universal || r.modelId);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Compatibilidade — {product?.name}</DialogTitle>
          <DialogDescription>
            Sem nenhuma regra, o produto aparece como compatibilidade desconhecida pra qualquer
            veículo (comportamento de hoje). Uma regra universal serve pra qualquer veículo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma regra cadastrada ainda.</p>
          )}
          {rows.map((row) => (
            <div key={row.key} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={row.universal}
                    onChange={(e) => updateRow(row.key, { universal: e.target.checked })}
                  />
                  Compatível com qualquer veículo (universal)
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                >
                  Remover
                </Button>
              </div>

              {!row.universal && (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={row.brandId}
                    onValueChange={(v) => updateRow(row.key, { brandId: v, modelId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={row.modelId}
                    onValueChange={(v) => updateRow(row.key, { modelId: v })}
                    disabled={!row.brandId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {models?.filter((m) => m.brandId === row.brandId).map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Ano de"
                    value={row.yearFrom}
                    onChange={(e) => updateRow(row.key, { yearFrom: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Ano até"
                    value={row.yearTo}
                    onChange={(e) => updateRow(row.key, { yearTo: e.target.value })}
                  />
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
            + Adicionar regra
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!canSave || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportFitmentsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FitmentImportResult | null>(null);

  const mutation = useMutation({
    mutationFn: () => importFitmentsCsv(file!),
    onSuccess: (data) => {
      setResult(data);
      if (data.successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'marketplace', 'products'] });
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao importar o arquivo.'),
  });

  const close = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar compatibilidade (CSV)</DialogTitle>
          <DialogDescription>
            Colunas esperadas: <code>sku</code>, <code>marca</code>, <code>modelo</code>,{' '}
            <code>ano_de</code>, <code>ano_ate</code>, <code>universal</code> (true/false). As regras
            são adicionadas às já existentes de cada produto — não substituem.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">
              {result.totalRows} linha(s) processada(s) · {result.successCount} regra(s) importada(s) ·{' '}
              {result.errorCount} erro(s).
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((err, i) => (
                      <TableRow key={i}>
                        <TableCell>{err.row || '—'}</TableCell>
                        <TableCell>{err.sku || '—'}</TableCell>
                        <TableCell className="text-destructive">{err.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {result ? 'Fechar' : 'Cancelar'}
          </Button>
          {!result && (
            <Button disabled={!file || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Importando...' : 'Importar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
