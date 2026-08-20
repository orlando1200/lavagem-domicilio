import { Injectable, Logger } from '@nestjs/common';
import { PlateLookupGateway, PlateLookupResult } from './plate-lookup-gateway.interface';

/**
 * Modo simulado — mesmo padrao de LogEmailAdapter/LogPushAdapter/
 * LocalDiskAdapter: implementa a interface real sem chamar nenhuma API
 * paga. Um punhado de placas de teste fixas retorna dados; qualquer
 * outra retorna `null` (simula "placa nao encontrada"), pra exercitar
 * os dois caminhos (Found/NotFound) sem depender de credencial externa.
 */
@Injectable()
export class MockPlateLookupAdapter implements PlateLookupGateway {
  private readonly logger = new Logger(MockPlateLookupAdapter.name);

  // Chaves ja normalizadas (sem hifen/espaco) — ver `normalize`.
  private readonly fixtures: Record<string, PlateLookupResult> = {
    ABC1D23: {
      brand: 'Fiat',
      model: 'Argo',
      modelYear: 2022,
      manufactureYear: 2021,
      color: 'Prata',
      fuelType: 'Flex',
    },
    XYZ4E56: {
      brand: 'Volkswagen',
      model: 'Gol',
      modelYear: 2020,
      manufactureYear: 2020,
      color: 'Branco',
      fuelType: 'Flex',
    },
    OLD1234: {
      brand: 'Toyota',
      model: 'Corolla',
      modelYear: 2018,
      manufactureYear: 2018,
      color: 'Preto',
      fuelType: 'Flex',
    },
  };

  async lookup(plate: string): Promise<PlateLookupResult | null> {
    const normalized = this.normalize(plate);
    const found = this.fixtures[normalized] ?? null;

    this.logger.log(
      `[plate-lookup mock] ${normalized} -> ${found ? `${found.brand} ${found.model}` : 'nao encontrada'}`,
    );

    return found;
  }

  private normalize(plate: string): string {
    return plate.toUpperCase().replace(/[\s-]/g, '');
  }
}
