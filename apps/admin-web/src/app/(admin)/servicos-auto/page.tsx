'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { listWashPrices, createWashPrice, updateWashPrice } from '@/lib/api/wash-pricing';
import { formatCurrencyBRL } from '@/lib/format';
import type { CarSize, WashPriceEntry, WashType } from '@/lib/types';

const CAR_SIZES: CarSize[] = ['PEQUENO', 'MEDIO', 'GRANDE'];
const WASH_TYPES: WashType[] = ['SECO', 'EXPRESSA', 'COMPLETA', 'HIGIENIZACAO_INTERNA', 'POLIMENTO'];

const CAR_SIZE_LABELS: Record<CarSize, string> = {
  PEQUENO: 'Pequeno / Hatch',
  MEDIO: 'Médio / Sedã',
  GRANDE: 'Grande / SUV',
};

const WASH_TYPE_LABELS: Record<WashType, string> = {
  SECO: 'Seco',
  EXPRESSA: 'Expressa',
  COMPLETA: 'Completa',
  HIGIENIZACAO_INTERNA: 'Higienização interna',
  POLIMENTO: 'Polimento',
};

export default function ServicosAutoPage() {
  const [editing, setEditing] = useState<{ carSize: CarSize; washType: WashType; entry: WashPriceEntry | null } | null>(
    null,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'wash-pricing'],
    queryFn: listWashPrices,
  });

  const entryFor = (carSize: CarSize, washType: WashType) =>
    data?.find((e) => e.carSize === carSize && e.washType === washType) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Serviços Auto — Lavagem por Tamanho</h1>
        <p className="text-sm text-muted-foreground">
          Matriz de preços tamanho × tipo de lavagem, usada no app do cliente. Uma célula sem preço
          cadastrado fica indisponível pro cliente.
        </p>
      </div>

      {isError && <p className="text-sm text-destructive">Não foi possível carregar a matriz de preços.</p>}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Tamanho \ Tipo</th>
              {WASH_TYPES.map((wt) => (
                <th key={wt} className="p-3 text-left font-medium">
                  {WASH_TYPE_LABELS[wt]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : (
              CAR_SIZES.map((cs) => (
                <tr key={cs} className="border-b last:border-0">
                  <td className="p-3 font-medium">{CAR_SIZE_LABELS[cs]}</td>
                  {WASH_TYPES.map((wt) => {
                    const entry = entryFor(cs, wt);
                    return (
                      <td key={wt} className="p-3">
                        <button
                          className="flex flex-col items-start gap-1 rounded-md border border-transparent p-2 text-left hover:border-border hover:bg-muted/50"
                          onClick={() => setEditing({ carSize: cs, washType: wt, entry })}
                        >
                          {entry ? (
                            <>
                              <span className="font-semibold">{formatCurrencyBRL(entry.price)}</span>
                              <Badge variant={entry.active ? 'success' : 'secondary'} className="text-[10px]">
                                {entry.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </>
                          ) : (
                            <span className="text-muted-foreground">— cadastrar</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && <WashPriceDialog target={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function WashPriceDialog({
  target,
  onClose,
}: {
  target: { carSize: CarSize; washType: WashType; entry: WashPriceEntry | null };
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { carSize, washType, entry } = target;
  const isEditing = !!entry;

  const [price, setPrice] = useState(entry ? String(entry.price) : '');
  const [active, setActive] = useState(entry?.active ?? true);

  const saveMutation = useMutation({
    mutationFn: () =>
      isEditing
        ? updateWashPrice(entry!.id, { price: Number(price), active })
        : createWashPrice({ carSize, washType, price: Number(price), active }),
    onSuccess: () => {
      toast.success(isEditing ? 'Preço atualizado.' : 'Preço cadastrado.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'wash-pricing'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao salvar preço.');
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {CAR_SIZE_LABELS[carSize]} · {WASH_TYPE_LABELS[washType]}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize o preço desta combinação.' : 'Cadastre o preço desta combinação.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Preço (R$)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="wash-price-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="wash-price-active">Ativo (visível no app do cliente)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!price || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
