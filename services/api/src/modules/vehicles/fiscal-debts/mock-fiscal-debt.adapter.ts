import { Injectable, Logger } from '@nestjs/common';
import { FiscalDebtGateway, FiscalDebtLookupResult } from './fiscal-debt-gateway.interface';

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Modo simulado — mesmo padrao de MockPlateLookupAdapter: nenhuma
 * chamada a API paga (SEFAZ/DETRAN nao tem API publica unificada por
 * estado). Reusa as mesmas placas fixas do plate-lookup pra manter a
 * demo consistente entre os dois modulos. Placa desconhecida ou sem
 * pendencia retorna array vazio — nao e erro, e o caminho normal.
 */
@Injectable()
export class MockFiscalDebtAdapter implements FiscalDebtGateway {
  private readonly logger = new Logger(MockFiscalDebtAdapter.name);

  async lookup(plate: string): Promise<FiscalDebtLookupResult[]> {
    const normalized = plate.toUpperCase().replace(/[\s-]/g, '');

    const fixtures: Record<string, FiscalDebtLookupResult[]> = {
      ABC1D23: [
        {
          type: 'IPVA',
          externalReference: 'IPVA-2026-COTA-2',
          description: 'IPVA 2026 — Cota 2 de 5',
          amount: 210.45,
          dueDate: daysFromNow(18),
        },
        {
          type: 'MULTA',
          externalReference: 'AIT-5566778899',
          description: 'Excesso de velocidade até 20% — Art. 218 CTB',
          amount: 195.23,
          dueDate: daysFromNow(-6),
        },
      ],
      XYZ4E56: [
        {
          type: 'IPVA',
          externalReference: 'IPVA-2026-COTA-1',
          description: 'IPVA 2026 — Cota única',
          amount: 389.9,
          dueDate: daysFromNow(45),
        },
      ],
      OLD1234: [],
    };

    const found = fixtures[normalized] ?? [];

    this.logger.log(`[fiscal-debt mock] ${normalized} -> ${found.length} debito(s)`);

    return found;
  }
}
