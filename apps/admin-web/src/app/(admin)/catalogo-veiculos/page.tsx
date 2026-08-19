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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createVehicleBrand,
  createVehicleCatalogModel,
  createVehicleCatalogYear,
  deleteVehicleBrand,
  deleteVehicleCatalogModel,
  deleteVehicleCatalogYear,
  listVehicleBrands,
  listVehicleCatalogModels,
  listVehicleCatalogYears,
  updateVehicleBrand,
  updateVehicleCatalogModel,
  updateVehicleCatalogYear,
} from '@/lib/api/vehicle-catalog';
import type { VehicleBrand, VehicleCatalogModel, VehicleCatalogType, VehicleCatalogYear } from '@/lib/types';

const VEHICLE_TYPE_LABELS: Record<VehicleCatalogType, string> = {
  carro: 'Carro',
  moto: 'Moto',
  caminhonete: 'Caminhonete',
  van: 'Van',
};

export default function CatalogoVeiculosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo de Veículos</h1>
        <p className="text-sm text-muted-foreground">
          Marca → Modelo → Ano. Conjunto representativo (não é integração com FIPE/TecDoc) usado
          hoje só como referência no cadastro de veículo dos clientes.
        </p>
      </div>

      <Tabs defaultValue="marcas">
        <TabsList>
          <TabsTrigger value="marcas">Marcas</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="anos">Anos</TabsTrigger>
        </TabsList>
        <TabsContent value="marcas">
          <BrandsTab />
        </TabsContent>
        <TabsContent value="modelos">
          <ModelsTab />
        </TabsContent>
        <TabsContent value="anos">
          <YearsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Marcas ───────────────────────────────────────────────────────────

function BrandsTab() {
  const [editing, setEditing] = useState<VehicleBrand | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'brands'],
    queryFn: listVehicleBrands,
  });

  return (
    <div className="space-y-3 pt-3">
      <div className="flex justify-end">
        <BrandDialog open={createOpen} onOpenChange={setCreateOpen} trigger={<Button>Nova marca</Button>} />
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar as marcas.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : data?.length ? (
            data.map((brand) => (
              <TableRow key={brand.id} className="cursor-pointer" onClick={() => setEditing(brand)}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="text-muted-foreground">{brand.slug}</TableCell>
                <TableCell>
                  <Badge variant={brand.active ? 'success' : 'secondary'}>
                    {brand.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Nenhuma marca cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editing && (
        <BrandDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} brand={editing} />
      )}
    </div>
  );
}

function BrandDialog({
  open,
  onOpenChange,
  brand,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: VehicleBrand;
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!brand;

  const [name, setName] = useState(brand?.name ?? '');
  const [active, setActive] = useState(brand?.active ?? true);

  const reset = () => {
    setName('');
    setActive(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing ? updateVehicleBrand(brand!.id, { name, active }) : createVehicleBrand({ name, active }),
    onSuccess: () => {
      toast.success(isEditing ? 'Marca atualizada.' : 'Marca criada.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'brands'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao salvar marca.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicleBrand(brand!.id),
    onSuccess: () => {
      toast.success('Marca removida.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'brands'] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao remover marca.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar marca' : 'Nova marca'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="brand-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="brand-active">Ativa (visível no cadastro de veículo)</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Remover
            </Button>
          )}
          <Button disabled={!name || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Modelos ──────────────────────────────────────────────────────────

function ModelsTab() {
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [editing, setEditing] = useState<VehicleCatalogModel | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: brands } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'brands'],
    queryFn: listVehicleBrands,
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'models'],
    queryFn: () => listVehicleCatalogModels(),
  });

  const brandName = (id: string) => brands?.find((b) => b.id === id)?.name ?? '—';
  const filtered = data?.filter((m) => brandFilter === 'all' || m.brandId === brandFilter);

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as marcas</SelectItem>
            {brands?.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {brands?.length ? (
          <ModelDialog open={createOpen} onOpenChange={setCreateOpen} brands={brands} trigger={<Button>Novo modelo</Button>} />
        ) : null}
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os modelos.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Tipo</TableHead>
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
          ) : filtered?.length ? (
            filtered.map((model) => (
              <TableRow key={model.id} className="cursor-pointer" onClick={() => setEditing(model)}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell className="text-muted-foreground">{brandName(model.brandId)}</TableCell>
                <TableCell>{VEHICLE_TYPE_LABELS[model.vehicleType]}</TableCell>
                <TableCell>
                  <Badge variant={model.active ? 'success' : 'secondary'}>
                    {model.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhum modelo cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editing && brands && (
        <ModelDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} model={editing} brands={brands} />
      )}
    </div>
  );
}

function ModelDialog({
  open,
  onOpenChange,
  model,
  brands,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: VehicleCatalogModel;
  brands: VehicleBrand[];
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!model;

  const [brandId, setBrandId] = useState(model?.brandId ?? brands[0]?.id ?? '');
  const [name, setName] = useState(model?.name ?? '');
  const [vehicleType, setVehicleType] = useState<VehicleCatalogType>(model?.vehicleType ?? 'carro');
  const [active, setActive] = useState(model?.active ?? true);

  const reset = () => {
    setBrandId(brands[0]?.id ?? '');
    setName('');
    setVehicleType('carro');
    setActive(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateVehicleCatalogModel(model!.id, { name, vehicleType, active })
        : createVehicleCatalogModel({ brandId, name, vehicleType, active }),
    onSuccess: () => {
      toast.success(isEditing ? 'Modelo atualizado.' : 'Modelo criado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'models'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao salvar modelo.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicleCatalogModel(model!.id),
    onSuccess: () => {
      toast.success('Modelo removido.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'models'] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao remover modelo.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar modelo' : 'Novo modelo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Marca</Label>
            <Select value={brandId} onValueChange={setBrandId} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
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
            <Label>Tipo de veículo</Label>
            <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleCatalogType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="model-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="model-active">Ativo</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Remover
            </Button>
          )}
          <Button disabled={!name || !brandId || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Anos ─────────────────────────────────────────────────────────────

function YearsTab() {
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [editing, setEditing] = useState<VehicleCatalogYear | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: brands } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'brands'],
    queryFn: listVehicleBrands,
  });
  const { data: models } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'models'],
    queryFn: () => listVehicleCatalogModels(),
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'vehicle-catalog', 'years'],
    queryFn: () => listVehicleCatalogYears(),
  });

  const modelLabel = (id: string) => {
    const model = models?.find((m) => m.id === id);
    if (!model) return '—';
    const brand = brands?.find((b) => b.id === model.brandId);
    return `${brand?.name ?? '—'} ${model.name}`;
  };
  const filtered = data?.filter((y) => modelFilter === 'all' || y.modelId === modelFilter);

  return (
    <div className="space-y-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os modelos</SelectItem>
            {models?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {modelLabel(m.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {models?.length ? (
          <YearDialog open={createOpen} onOpenChange={setCreateOpen} models={models} modelLabel={modelLabel} trigger={<Button>Novo ano</Button>} />
        ) : null}
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar os anos.</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : filtered?.length ? (
            filtered
              .sort((a, b) => b.year - a.year)
              .map((year) => (
                <TableRow key={year.id} className="cursor-pointer" onClick={() => setEditing(year)}>
                  <TableCell className="font-medium">{modelLabel(year.modelId)}</TableCell>
                  <TableCell>{year.year}</TableCell>
                  <TableCell>
                    <Badge variant={year.active ? 'success' : 'secondary'}>
                      {year.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Nenhum ano cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editing && models && (
        <YearDialog
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          year={editing}
          models={models}
          modelLabel={modelLabel}
        />
      )}
    </div>
  );
}

function YearDialog({
  open,
  onOpenChange,
  year,
  models,
  modelLabel,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year?: VehicleCatalogYear;
  models: VehicleCatalogModel[];
  modelLabel: (id: string) => string;
  trigger?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!year;

  const [modelId, setModelId] = useState(year?.modelId ?? models[0]?.id ?? '');
  const [yearValue, setYearValue] = useState(year ? String(year.year) : '');
  const [active, setActive] = useState(year?.active ?? true);

  const reset = () => {
    setModelId(models[0]?.id ?? '');
    setYearValue('');
    setActive(true);
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateVehicleCatalogYear(year!.id, { year: Number(yearValue), active })
        : createVehicleCatalogYear({ modelId, year: Number(yearValue), active }),
    onSuccess: () => {
      toast.success(isEditing ? 'Ano atualizado.' : 'Ano criado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'years'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao salvar ano.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicleCatalogYear(year!.id),
    onSuccess: () => {
      toast.success('Ano removido.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'vehicle-catalog', 'years'] });
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao remover ano.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar ano' : 'Novo ano'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select value={modelId} onValueChange={setModelId} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {modelLabel(m.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Ano</Label>
            <Input type="number" value={yearValue} onChange={(e) => setYearValue(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="year-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="year-active">Ativo</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          {isEditing && (
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              Remover
            </Button>
          )}
          <Button disabled={!yearValue || !modelId || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
