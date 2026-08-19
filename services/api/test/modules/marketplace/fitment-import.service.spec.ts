import { Test, TestingModule } from '@nestjs/testing';
import { FitmentImportService } from '../../../src/modules/marketplace/fitment-import.service';
import { PrismaService } from '../../../src/database/prisma.service';

const csv = (rows: string[]) => Buffer.from(['sku,marca,modelo,ano_de,ano_ate,universal', ...rows].join('\n'), 'utf-8');

describe('FitmentImportService', () => {
  let service: FitmentImportService;
  let prisma: {
    product: { findMany: jest.Mock };
    vehicleBrand: { findMany: jest.Mock };
    vehicleCatalogModel: { findMany: jest.Mock };
    productFitment: { createMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn().mockResolvedValue([{ id: 'prod-1', sku: 'SKU-1' }]) },
      vehicleBrand: { findMany: jest.fn().mockResolvedValue([{ id: 'brand-1', name: 'Fiat' }]) },
      vehicleCatalogModel: {
        findMany: jest.fn().mockResolvedValue([{ id: 'model-1', name: 'Argo', brandId: 'brand-1' }]),
      },
      productFitment: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [FitmentImportService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(FitmentImportService);
  });

  it('retorna zero linhas para um arquivo vazio (so cabecalho)', async () => {
    const result = await service.importCsv(csv([]));
    expect(result).toEqual({ totalRows: 0, successCount: 0, errorCount: 0, errors: [] });
  });

  it('importa uma linha valida com marca+modelo+intervalo de anos', async () => {
    const result = await service.importCsv(csv(['SKU-1,Fiat,Argo,2018,2022,']));
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(0);
    expect(prisma.productFitment.createMany).toHaveBeenCalledWith({
      data: [{ productId: 'prod-1', universal: false, brandId: 'brand-1', modelId: 'model-1', yearFrom: 2018, yearTo: 2022 }],
    });
  });

  it('importa uma linha universal (marca/modelo vazios sao permitidos)', async () => {
    const result = await service.importCsv(csv(['SKU-1,,,,,true']));
    expect(result.successCount).toBe(1);
    expect(prisma.productFitment.createMany).toHaveBeenCalledWith({
      data: [{ productId: 'prod-1', universal: true, brandId: null, modelId: null, yearFrom: null, yearTo: null }],
    });
  });

  it('marca erro quando o SKU nao existe em nenhum produto', async () => {
    const result = await service.importCsv(csv(['SKU-DESCONHECIDO,Fiat,Argo,,,']));
    expect(result.successCount).toBe(0);
    expect(result.errors).toEqual([{ row: 2, sku: 'SKU-DESCONHECIDO', message: 'SKU nao encontrado em nenhum produto' }]);
  });

  it('marca erro quando a marca nao existe no catalogo', async () => {
    const result = await service.importCsv(csv(['SKU-1,MarcaFake,Argo,,,']));
    expect(result.errors[0].message).toContain('Marca "MarcaFake" nao encontrada');
  });

  it('marca erro quando o modelo nao existe para a marca informada', async () => {
    const result = await service.importCsv(csv(['SKU-1,Fiat,ModeloFake,,,']));
    expect(result.errors[0].message).toContain('Modelo "ModeloFake" nao encontrado');
  });

  it('marca erro quando ano_de e maior que ano_ate', async () => {
    const result = await service.importCsv(csv(['SKU-1,Fiat,Argo,2022,2018,']));
    expect(result.errors[0].message).toBe('ano_de nao pode ser maior que ano_ate');
  });

  it('marca erro quando a linha nao tem sku', async () => {
    const result = await service.importCsv(csv([',Fiat,Argo,,,']));
    expect(result.errors[0].message).toBe('Coluna sku vazia');
  });

  it('marca erro quando SKU e ambiguo (mais de um produto usa o mesmo sku)', async () => {
    prisma.product.findMany.mockResolvedValue([
      { id: 'prod-1', sku: 'SKU-1' },
      { id: 'prod-2', sku: 'SKU-1' },
    ]);
    const result = await service.importCsv(csv(['SKU-1,Fiat,Argo,,,']));
    expect(result.errors[0].message).toContain('ambiguo');
  });

  it('processa duas linhas com o mesmo SKU como duas regras separadas do mesmo produto', async () => {
    const result = await service.importCsv(csv(['SKU-1,Fiat,Argo,2018,2020,', 'SKU-1,,,,,true']));
    expect(result.successCount).toBe(2);
    expect(prisma.productFitment.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.productFitment.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 'prod-1', universal: false, brandId: 'brand-1', modelId: 'model-1', yearFrom: 2018, yearTo: 2020 },
        { productId: 'prod-1', universal: true, brandId: null, modelId: null, yearFrom: null, yearTo: null },
      ],
    });
  });

  it('continua processando as demais linhas quando uma linha e invalida', async () => {
    const result = await service.importCsv(csv(['SKU-1,Fiat,Argo,,,', 'SKU-DESCONHECIDO,Fiat,Argo,,,']));
    expect(result.totalRows).toBe(2);
    expect(result.successCount).toBe(1);
    expect(result.errorCount).toBe(1);
  });
});
