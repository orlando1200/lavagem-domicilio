'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
  updateServiceCategory,
} from '@/lib/api/service-categories';
import { formatCurrencyBRL } from '@/lib/format';
import type { ServiceCategory, ServiceType } from '@/lib/types';

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  DRY_WASH: 'Lavagem a Seco',
  EXPRESS_WASH: 'Lavagem Express',
  HEAVY_SERVICE: 'Serviço Pesado (Leilão)',
};

const CATALOGABLE_TYPES: ServiceType[] = ['DRY_WASH', 'EXPRESS_WASH'];

export default function CategoriasPage() {
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'service-categories'],
    queryFn: listServiceCategories,
  });

  const usedTypes = new Set(data?.map((c) => c.serviceType));
  const availableTypes = CATALOGABLE_TYPES.filter((t) => !usedTypes.has(t));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categorias / Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Preços dos serviços de lavagem (Lavagem a Seco e Lavagem Express). O Serviço Pesado
            não tem preço fixo — vai a leilão.
          </p>
        </div>
        {availableTypes.length > 0 && (
          <ServiceCategoryDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            availableTypes={availableTypes}
            trigger={<Button>Nova categoria</Button>}
          />
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar as categorias.</p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
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
            data.map((category) => (
              <TableRow
                key={category.id}
                className="cursor-pointer"
                onClick={() => setEditing(category)}
              >
                <TableCell>{SERVICE_TYPE_LABELS[category.serviceType]}</TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{formatCurrencyBRL(category.price)}</TableCell>
                <TableCell>
                  <Badge variant={category.active ? 'success' : 'secondary'}>
                    {category.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhuma categoria cadastrada — o app do cliente não terá preços reais até que ao
                menos uma seja criada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editing && (
        <ServiceCategoryDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          category={editing}
          availableTypes={[editing.serviceType]}
        />
      )}
    </div>
  );
}

function ServiceCategoryDialog({
  open,
  onOpenChange,
  category,
  availableTypes,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ServiceCategory;
  availableTypes: ServiceType[];
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const [serviceType, setServiceType] = useState<ServiceType>(category?.serviceType ?? availableTypes[0]);
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [price, setPrice] = useState(category ? String(category.price) : '');
  const [active, setActive] = useState(category?.active ?? true);

  const reset = () => {
    setServiceType(availableTypes[0]);
    setName('');
    setDescription('');
    setPrice('');
    setActive(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateServiceCategory(category!.id, {
            name,
            description: description || undefined,
            price: Number(price),
            active,
          })
        : createServiceCategory({
            serviceType,
            name,
            description: description || undefined,
            price: Number(price),
            active,
          }),
    onSuccess: () => {
      toast.success(isEditing ? 'Categoria atualizada.' : 'Categoria criada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-categories'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar categoria.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteServiceCategory(category!.id),
    onSuccess: () => {
      toast.success('Categoria removida.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'service-categories'] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao remover categoria.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select
              value={serviceType}
              onValueChange={(v) => setServiceType(v as ServiceType)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SERVICE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Preço (R$)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="active">Ativo (visível no app do cliente)</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              Remover
            </Button>
          )}
          <Button
            disabled={!name || !price || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
