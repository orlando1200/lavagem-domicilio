export interface PlateLookupResult {
  brand: string;
  model: string;
  modelYear: number | null;
  manufactureYear: number | null;
  color: string | null;
  fuelType: string | null;
}

/**
 * Consulta de dados veiculares por placa (SERPRO/Infosimples/etc — ver
 * docs/PROGRESSO.md). `lookup` retorna `null` quando a placa nao e
 * encontrada na base consultada (caso de negocio normal, nao um erro) —
 * so lanca excecao em falha real de rede/API.
 */
export interface PlateLookupGateway {
  lookup(plate: string): Promise<PlateLookupResult | null>;
}

export const PLATE_LOOKUP_GATEWAY = Symbol('PLATE_LOOKUP_GATEWAY');
