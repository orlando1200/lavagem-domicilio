export type FiscalDebtKind = 'IPVA' | 'MULTA' | 'LICENCIAMENTO';

export interface FiscalDebtLookupResult {
  type: FiscalDebtKind;
  /** Identificador estavel do provedor (parcela do IPVA, numero do AIT da multa etc). */
  externalReference: string;
  description: string;
  amount: number;
  dueDate: string | null;
}

export interface FiscalDebtGateway {
  /** Lista de debitos abertos pra placa. Array vazio significa "sem debitos", nao erro. */
  lookup(plate: string): Promise<FiscalDebtLookupResult[]>;
}

export const FISCAL_DEBT_GATEWAY = Symbol('FISCAL_DEBT_GATEWAY');
