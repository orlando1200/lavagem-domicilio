export type FitmentCompatibility = 'UNIVERSAL' | 'EXACT_MATCH' | 'NOT_COMPATIBLE' | 'UNKNOWN';

/** Veiculo resolvido do catalogo (marca/modelo/ano) — null quando o
 * veiculo do usuario nao tem `catalogYearId` (cadastro livre, sem catalogo). */
export interface ResolvedVehicle {
  brandId: string;
  modelId: string;
  year: number;
}

export interface FitmentRule {
  universal: boolean;
  brandId: string | null;
  modelId: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

/**
 * Compatibilidade de um produto com um veiculo, dado o conjunto de regras
 * de fitment cadastradas pro produto (`ProductFitment`).
 *
 * - Sem veiculo resolvido (usuario nao escolheu catalogo) -> `UNKNOWN`.
 * - Produto sem nenhuma regra cadastrada (acessorio generico de hoje) -> `UNKNOWN`.
 * - Alguma regra `universal` -> `UNIVERSAL` (serve pra qualquer veiculo).
 * - Alguma regra bate marca+modelo e o ano cai no intervalo -> `EXACT_MATCH`.
 * - Tem regras mas nenhuma bate -> `NOT_COMPATIBLE`.
 */
export function matchFitment(
  vehicle: ResolvedVehicle | null,
  rules: FitmentRule[],
): FitmentCompatibility {
  if (rules.length === 0) {
    return 'UNKNOWN';
  }
  if (rules.some((rule) => rule.universal)) {
    return 'UNIVERSAL';
  }
  if (!vehicle) {
    return 'UNKNOWN';
  }

  const matches = rules.some((rule) => {
    if (rule.modelId !== vehicle.modelId) {
      return false;
    }
    if (rule.yearFrom !== null && vehicle.year < rule.yearFrom) {
      return false;
    }
    if (rule.yearTo !== null && vehicle.year > rule.yearTo) {
      return false;
    }
    return true;
  });

  return matches ? 'EXACT_MATCH' : 'NOT_COMPATIBLE';
}
