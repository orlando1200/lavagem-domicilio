// Tarifas de comissao/mensalidade por combinacao StoreType x LogisticsPlan.
// Fonte: especificacao de negocio do marketplace dual (Fase 9).
import { LogisticsPlan, StoreType } from '@prisma/client';

export interface CommissionRate {
  monthlyFee: number;
  takeRate: number; // fracao decimal, ex: 0.23 = 23%
}

export const COMMISSION_PLAN_TABLE: Record<
  StoreType,
  Record<LogisticsPlan, CommissionRate>
> = {
  [StoreType.LAVADOR]: {
    [LogisticsPlan.INTEGRATED]: { monthlyFee: 150, takeRate: 0.23 },
    [LogisticsPlan.OWN]: { monthlyFee: 110, takeRate: 0.15 },
  },
  [StoreType.CLIENTE]: {
    [LogisticsPlan.INTEGRATED]: { monthlyFee: 59, takeRate: 0.18 },
    [LogisticsPlan.OWN]: { monthlyFee: 29, takeRate: 0.12 },
  },
};

export function getCommissionRate(
  storeType: StoreType,
  logisticsPlan: LogisticsPlan,
): CommissionRate {
  return COMMISSION_PLAN_TABLE[storeType][logisticsPlan];
}
