import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Decimal do Prisma serializa como string no JSON — parse defensivo
 * que aceita os dois formatos (mesmo padrao `_parseDouble` usado nos
 * apps Flutter desta sessão). */
export function parseDecimal(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrencyBRL(value: string | number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    parseDecimal(value),
  );
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function truncateId(id: string, length = 8): string {
  return id.length > length ? `${id.slice(0, length)}…` : id;
}
