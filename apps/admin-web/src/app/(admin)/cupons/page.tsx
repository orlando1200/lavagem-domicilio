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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginationControls } from '@/components/admin/pagination-controls';
import {
  createCampaign,
  createCoupon,
  deleteCoupon,
  listCampaigns,
  listCoupons,
  updateCoupon,
} from '@/lib/api/coupons';
import { formatCurrencyBRL, formatDate } from '@/lib/format';
import { couponDiscountTypeLabel } from '@/lib/status-badge';
import type { Coupon, CouponDiscountType } from '@/lib/types';

export default function CuponsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Cupons</h1>
        <p className="text-sm text-muted-foreground">Cupons de desconto e campanhas.</p>
      </div>

      <Tabs defaultValue="cupons">
        <TabsList>
          <TabsTrigger value="cupons">Cupons</TabsTrigger>
          <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
        </TabsList>
        <TabsContent value="cupons">
          <CouponsTab />
        </TabsContent>
        <TabsContent value="campanhas">
          <CampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CouponsTab() {
  const [isActive, setIsActive] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Coupon | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'coupons', 'list', { isActive, page }],
    queryFn: () =>
      listCoupons({
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        page,
        limit: 20,
      }),
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Select
            value={isActive}
            onValueChange={(v) => {
              setIsActive(v as 'all' | 'true' | 'false');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Ativos</SelectItem>
              <SelectItem value="false">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateCouponDialog />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os cupons.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Desconto</TableHead>
            <TableHead>Uso</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead>Campanha</TableHead>
            <TableHead>Status</TableHead>
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
            data.data.map((coupon) => (
              <TableRow
                key={coupon.id}
                className="cursor-pointer"
                onClick={() => setSelected(coupon)}
              >
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.discountType === 'percent'
                    ? `${coupon.discountValue}%`
                    : formatCurrencyBRL(coupon.discountValue)}
                </TableCell>
                <TableCell>
                  {coupon.usedCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                </TableCell>
                <TableCell>{coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}</TableCell>
                <TableCell>{coupon.campaign?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={coupon.isActive ? 'success' : 'secondary'}>
                    {coupon.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum cupom encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data && (
        <PaginationControls page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
      )}

      <CouponDetailSheet coupon={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function CreateCouponDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: campaigns } = useQuery({
    queryKey: ['admin', 'coupons', 'campaigns'],
    queryFn: listCampaigns,
  });
  const [campaignId, setCampaignId] = useState<string>('none');

  const reset = () => {
    setCode('');
    setDiscountType('percent');
    setDiscountValue('');
    setMaxUses('');
    setMinOrderAmount('');
    setExpiresAt('');
    setCampaignId('none');
  };

  const mutation = useMutation({
    mutationFn: () =>
      createCoupon({
        code: code.toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        maxUses: maxUses ? Number(maxUses) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        campaignId: campaignId === 'none' ? undefined : campaignId,
      }),
    onSuccess: () => {
      toast.success('Cupom criado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      reset();
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar cupom.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo cupom</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cupom</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BEMVINDO10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de desconto</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as CouponDiscountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">{couponDiscountTypeLabel('percent')}</SelectItem>
                  <SelectItem value="fixed">{couponDiscountTypeLabel('fixed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '25.00'}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Usos máximos (opcional)</Label>
              <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Pedido mínimo (opcional)</Label>
              <Input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Expira em (opcional)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Campanha (opcional)</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {campaigns?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!code || !discountValue || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Criando...' : 'Criar cupom'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CouponDetailSheet({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => deleteCoupon(coupon!.id),
    onSuccess: () => {
      toast.success('Cupom desativado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao desativar cupom.');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => updateCoupon(coupon!.id, { isActive: true }),
    onSuccess: () => {
      toast.success('Cupom reativado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao reativar cupom.');
    },
  });

  return (
    <Sheet open={!!coupon} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{coupon?.code}</SheetTitle>
          <SheetDescription>
            {coupon ? couponDiscountTypeLabel(coupon.discountType) : ''}
          </SheetDescription>
        </SheetHeader>

        {coupon && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Desconto</p>
                <p className="font-medium">
                  {coupon.discountType === 'percent'
                    ? `${coupon.discountValue}%`
                    : formatCurrencyBRL(coupon.discountValue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={coupon.isActive ? 'success' : 'secondary'}>
                  {coupon.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Usos</p>
                <p className="font-medium">
                  {coupon.usedCount}
                  {coupon.maxUses ? ` / ${coupon.maxUses}` : ' (ilimitado)'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pedido mínimo</p>
                <p className="font-medium">
                  {coupon.minOrderAmount ? formatCurrencyBRL(coupon.minOrderAmount) : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Expira em</p>
                <p className="font-medium">{coupon.expiresAt ? formatDate(coupon.expiresAt) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Campanha</p>
                <p className="font-medium">{coupon.campaign?.name ?? '—'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              {coupon.isActive ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate()}
                >
                  {deactivateMutation.isPending ? 'Desativando...' : 'Desativar cupom'}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={reactivateMutation.isPending}
                  onClick={() => reactivateMutation.mutate()}
                >
                  {reactivateMutation.isPending ? 'Reativando...' : 'Reativar cupom'}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CampaignsTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'coupons', 'campaigns'],
    queryFn: listCampaigns,
  });

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <CreateCampaignDialog />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar as campanhas.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Início</TableHead>
            <TableHead>Fim</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.length ? (
            data.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{formatDate(c.startsAt)}</TableCell>
                <TableCell>{c.endsAt ? formatDate(c.endsAt) : '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? 'success' : 'secondary'}>
                    {c.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhuma campanha encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CreateCampaignDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createCampaign({
        name,
        description: description || undefined,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success('Campanha criada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons', 'campaigns'] });
      setName('');
      setDescription('');
      setStartsAt('');
      setEndsAt('');
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao criar campanha.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova campanha</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim (opcional)</Label>
              <Input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!name || !startsAt || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Criando...' : 'Criar campanha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
