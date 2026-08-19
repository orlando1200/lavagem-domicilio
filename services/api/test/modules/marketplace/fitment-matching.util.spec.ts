import { matchFitment, FitmentRule, ResolvedVehicle } from '../../../src/modules/marketplace/fitment-matching.util';

const vehicle = (overrides: Partial<ResolvedVehicle> = {}): ResolvedVehicle => ({
  brandId: 'brand-1',
  modelId: 'model-1',
  year: 2020,
  ...overrides,
});

const rule = (overrides: Partial<FitmentRule> = {}): FitmentRule => ({
  universal: false,
  brandId: null,
  modelId: null,
  yearFrom: null,
  yearTo: null,
  ...overrides,
});

describe('matchFitment', () => {
  it('retorna UNKNOWN quando o produto nao tem nenhuma regra cadastrada', () => {
    expect(matchFitment(vehicle(), [])).toBe('UNKNOWN');
  });

  it('retorna UNKNOWN quando o veiculo nao tem catalogo resolvido e o produto tem regras', () => {
    expect(matchFitment(null, [rule({ modelId: 'model-1' })])).toBe('UNKNOWN');
  });

  it('retorna UNIVERSAL quando alguma regra e universal, mesmo sem veiculo', () => {
    expect(matchFitment(null, [rule({ universal: true })])).toBe('UNIVERSAL');
    expect(matchFitment(vehicle(), [rule({ universal: true })])).toBe('UNIVERSAL');
  });

  it('retorna EXACT_MATCH quando o modelo bate e o ano esta dentro do intervalo', () => {
    const rules = [rule({ modelId: 'model-1', yearFrom: 2018, yearTo: 2022 })];
    expect(matchFitment(vehicle({ year: 2020 }), rules)).toBe('EXACT_MATCH');
  });

  it('retorna EXACT_MATCH quando o intervalo de ano e aberto (sem yearFrom/yearTo)', () => {
    const rules = [rule({ modelId: 'model-1' })];
    expect(matchFitment(vehicle({ year: 1999 }), rules)).toBe('EXACT_MATCH');
  });

  it('retorna NOT_COMPATIBLE quando o modelo bate mas o ano esta fora do intervalo', () => {
    const rules = [rule({ modelId: 'model-1', yearFrom: 2018, yearTo: 2022 })];
    expect(matchFitment(vehicle({ year: 2023 }), rules)).toBe('NOT_COMPATIBLE');
  });

  it('retorna NOT_COMPATIBLE quando nenhuma regra bate o modelo do veiculo', () => {
    const rules = [rule({ modelId: 'model-2' })];
    expect(matchFitment(vehicle({ modelId: 'model-1' }), rules)).toBe('NOT_COMPATIBLE');
  });

  it('EXACT_MATCH vence quando ha varias regras e apenas uma bate', () => {
    const rules = [
      rule({ modelId: 'model-2', yearFrom: 2010, yearTo: 2015 }),
      rule({ modelId: 'model-1', yearFrom: 2018, yearTo: 2022 }),
    ];
    expect(matchFitment(vehicle({ modelId: 'model-1', year: 2019 }), rules)).toBe('EXACT_MATCH');
  });
});
