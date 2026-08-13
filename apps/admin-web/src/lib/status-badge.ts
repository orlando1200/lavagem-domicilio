import type { BadgeProps } from '@/components/ui/badge';
import type {
  CouponDiscountType,
  DriverStatus,
  OrderStatus,
  PayoutStatus,
  ProductStatus,
  RentalStatus,
  StarterKitStatus,
  StoreStatus,
  SupportTicketStatus,
} from './types';

type Variant = NonNullable<BadgeProps['variant']>;

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendente',
  searching_washer: 'Buscando lavador',
  accepted: 'Aceito',
  en_route: 'A caminho',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const ORDER_STATUS_VARIANT: Record<OrderStatus, Variant> = {
  pending: 'secondary',
  searching_washer: 'warning',
  accepted: 'default',
  en_route: 'default',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'destructive',
};

const DRIVER_STATUS_LABEL: Record<DriverStatus, string> = {
  draft: 'Rascunho',
  pending_documents: 'Documentos pendentes',
  awaiting_kit: 'Aguardando kit',
  active: 'Ativo',
  inactive: 'Inativo',
  rejected: 'Rejeitado',
  blocked: 'Bloqueado',
};

const DRIVER_STATUS_VARIANT: Record<DriverStatus, Variant> = {
  draft: 'secondary',
  pending_documents: 'warning',
  awaiting_kit: 'warning',
  active: 'success',
  inactive: 'secondary',
  rejected: 'destructive',
  blocked: 'destructive',
};

const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  active: 'Ativo',
  inactive: 'Inativo',
  rejected: 'Rejeitado',
};

const PRODUCT_STATUS_VARIANT: Record<ProductStatus, Variant> = {
  draft: 'secondary',
  pending_approval: 'warning',
  active: 'success',
  inactive: 'secondary',
  rejected: 'destructive',
};

const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  paid: 'Pago',
  rejected: 'Rejeitado',
};

const PAYOUT_STATUS_VARIANT: Record<PayoutStatus, Variant> = {
  pending: 'warning',
  approved: 'default',
  paid: 'success',
  rejected: 'destructive',
};

const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
  pending: 'Pendente',
  active: 'Ativa',
  inactive: 'Inativa',
  blocked: 'Bloqueada',
};

const STORE_STATUS_VARIANT: Record<StoreStatus, Variant> = {
  pending: 'warning',
  active: 'success',
  inactive: 'secondary',
  blocked: 'destructive',
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}
export function orderStatusVariant(status: OrderStatus): Variant {
  return ORDER_STATUS_VARIANT[status] ?? 'secondary';
}

export function driverStatusLabel(status: DriverStatus): string {
  return DRIVER_STATUS_LABEL[status] ?? status;
}
export function driverStatusVariant(status: DriverStatus): Variant {
  return DRIVER_STATUS_VARIANT[status] ?? 'secondary';
}

export function productStatusLabel(status: ProductStatus): string {
  return PRODUCT_STATUS_LABEL[status] ?? status;
}
export function productStatusVariant(status: ProductStatus): Variant {
  return PRODUCT_STATUS_VARIANT[status] ?? 'secondary';
}

export function payoutStatusLabel(status: PayoutStatus): string {
  return PAYOUT_STATUS_LABEL[status] ?? status;
}
export function payoutStatusVariant(status: PayoutStatus): Variant {
  return PAYOUT_STATUS_VARIANT[status] ?? 'secondary';
}

export function storeStatusLabel(status: StoreStatus): string {
  return STORE_STATUS_LABEL[status] ?? status;
}
export function storeStatusVariant(status: StoreStatus): Variant {
  return STORE_STATUS_VARIANT[status] ?? 'secondary';
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'searching_washer',
  'accepted',
  'en_route',
  'in_progress',
  'completed',
  'cancelled',
];

export const DRIVER_STATUS_OPTIONS: DriverStatus[] = [
  'draft',
  'pending_documents',
  'awaiting_kit',
  'active',
  'inactive',
  'rejected',
  'blocked',
];

export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = [
  'draft',
  'pending_approval',
  'active',
  'inactive',
  'rejected',
];

export const PAYOUT_STATUS_OPTIONS: PayoutStatus[] = ['pending', 'approved', 'paid', 'rejected'];

const COUPON_DISCOUNT_TYPE_LABEL: Record<CouponDiscountType, string> = {
  percent: 'Percentual',
  fixed: 'Valor fixo',
};

export function couponDiscountTypeLabel(type: CouponDiscountType): string {
  return COUPON_DISCOUNT_TYPE_LABEL[type] ?? type;
}

const STARTER_KIT_STATUS_LABEL: Record<StarterKitStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const STARTER_KIT_STATUS_VARIANT: Record<StarterKitStatus, Variant> = {
  pending: 'warning',
  paid: 'default',
  shipped: 'default',
  delivered: 'success',
  cancelled: 'destructive',
};

export function starterKitStatusLabel(status: StarterKitStatus): string {
  return STARTER_KIT_STATUS_LABEL[status] ?? status;
}
export function starterKitStatusVariant(status: StarterKitStatus): Variant {
  return STARTER_KIT_STATUS_VARIANT[status] ?? 'secondary';
}

export const STARTER_KIT_STATUS_OPTIONS: StarterKitStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
];

const SUPPORT_TICKET_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const SUPPORT_TICKET_STATUS_VARIANT: Record<SupportTicketStatus, Variant> = {
  open: 'warning',
  in_progress: 'default',
  resolved: 'success',
  closed: 'secondary',
};

export function supportTicketStatusLabel(status: SupportTicketStatus): string {
  return SUPPORT_TICKET_STATUS_LABEL[status] ?? status;
}
export function supportTicketStatusVariant(status: SupportTicketStatus): Variant {
  return SUPPORT_TICKET_STATUS_VARIANT[status] ?? 'secondary';
}

export const SUPPORT_TICKET_STATUS_OPTIONS: SupportTicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
];

const RENTAL_STATUS_LABEL: Record<RentalStatus, string> = {
  requested: 'Solicitada',
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  overdue: 'Atrasada',
};

const RENTAL_STATUS_VARIANT: Record<RentalStatus, Variant> = {
  requested: 'warning',
  active: 'success',
  completed: 'secondary',
  cancelled: 'destructive',
  overdue: 'destructive',
};

export function rentalStatusLabel(status: RentalStatus): string {
  return RENTAL_STATUS_LABEL[status] ?? status;
}
export function rentalStatusVariant(status: RentalStatus): Variant {
  return RENTAL_STATUS_VARIANT[status] ?? 'secondary';
}

export const RENTAL_STATUS_OPTIONS: RentalStatus[] = [
  'requested',
  'active',
  'completed',
  'cancelled',
  'overdue',
];
