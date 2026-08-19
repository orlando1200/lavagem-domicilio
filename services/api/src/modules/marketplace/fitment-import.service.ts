import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../database/prisma.service';

interface ParsedRow {
  row: number;
  sku: string;
  universal: boolean;
  brandName: string;
  modelName: string;
  yearFrom: number | null;
  yearTo: number | null;
}

interface ImportError {
  row: number;
  sku: string;
  message: string;
}

interface ValidRule {
  productId: string;
  universal: boolean;
  brandId: string | null;
  modelId: string | null;
  yearFrom: number | null;
  yearTo: number | null;
}

export interface FitmentImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

const TRUE_VALUES = new Set(['true', '1', 'sim', 'yes']);

/**
 * Import CSV de compatibilidade em massa. Colunas esperadas: sku, marca,
 * modelo, ano_de, ano_ate, universal. Linhas invalidas nao abortam o
 * arquivo inteiro — cada produto valido e importado em sua propria
 * operacao, isolado dos demais. Import e aditivo: adiciona regras novas
 * sem apagar as ja cadastradas (diferente do dialog manual, que substitui
 * o conjunto inteiro de um produto por vez).
 */
@Injectable()
export class FitmentImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(buffer: Buffer): Promise<FitmentImportResult> {
    const rawRows = this.parseCsv(buffer);

    const errors: ImportError[] = [];
    const parsedRows: ParsedRow[] = [];

    rawRows.forEach((raw, index) => {
      const row = index + 2; // +1 header, +1 base-1
      const result = this.parseRow(raw, row);
      if ('error' in result) {
        errors.push({ row, sku: raw.sku ?? '', message: result.error });
      } else {
        parsedRows.push(result.parsed);
      }
    });

    const skus = [...new Set(parsedRows.map((r) => r.sku))];
    const products = skus.length
      ? await this.prisma.product.findMany({ where: { sku: { in: skus } }, select: { id: true, sku: true } })
      : [];
    const productsBySku = new Map<string, string[]>();
    for (const product of products) {
      if (!product.sku) continue;
      const list = productsBySku.get(product.sku) ?? [];
      list.push(product.id);
      productsBySku.set(product.sku, list);
    }

    const brands = await this.prisma.vehicleBrand.findMany({ select: { id: true, name: true } });
    const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

    const models = await this.prisma.vehicleCatalogModel.findMany({ select: { id: true, name: true, brandId: true } });

    const validRules: ValidRule[] = [];

    for (const parsed of parsedRows) {
      const productIds = productsBySku.get(parsed.sku);
      if (!productIds || productIds.length === 0) {
        errors.push({ row: parsed.row, sku: parsed.sku, message: 'SKU nao encontrado em nenhum produto' });
        continue;
      }
      if (productIds.length > 1) {
        errors.push({ row: parsed.row, sku: parsed.sku, message: 'SKU ambiguo — mais de um produto usa este SKU' });
        continue;
      }
      const productId = productIds[0];

      if (parsed.universal) {
        validRules.push({ productId, universal: true, brandId: null, modelId: null, yearFrom: null, yearTo: null });
        continue;
      }

      const brandId = brandByName.get(parsed.brandName.toLowerCase());
      if (!brandId) {
        errors.push({ row: parsed.row, sku: parsed.sku, message: `Marca "${parsed.brandName}" nao encontrada no catalogo` });
        continue;
      }
      const model = models.find(
        (m) => m.brandId === brandId && m.name.toLowerCase() === parsed.modelName.toLowerCase(),
      );
      if (!model) {
        errors.push({ row: parsed.row, sku: parsed.sku, message: `Modelo "${parsed.modelName}" nao encontrado para a marca "${parsed.brandName}"` });
        continue;
      }

      validRules.push({
        productId,
        universal: false,
        brandId,
        modelId: model.id,
        yearFrom: parsed.yearFrom,
        yearTo: parsed.yearTo,
      });
    }

    const rulesByProduct = new Map<string, ValidRule[]>();
    for (const rule of validRules) {
      const list = rulesByProduct.get(rule.productId) ?? [];
      list.push(rule);
      rulesByProduct.set(rule.productId, list);
    }

    let successCount = 0;
    for (const [productId, rules] of rulesByProduct) {
      try {
        await this.prisma.productFitment.createMany({
          data: rules.map((rule) => ({
            productId: rule.productId,
            universal: rule.universal,
            brandId: rule.brandId,
            modelId: rule.modelId,
            yearFrom: rule.yearFrom,
            yearTo: rule.yearTo,
          })),
        });
        successCount += rules.length;
      } catch (err) {
        const sku = parsedRows.find((r) => productsBySku.get(r.sku)?.[0] === productId)?.sku ?? '';
        errors.push({
          row: 0,
          sku,
          message: `Falha ao salvar as regras deste produto: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
        });
      }
    }

    return {
      totalRows: rawRows.length,
      successCount,
      errorCount: errors.length,
      errors: errors.sort((a, b) => a.row - b.row),
    };
  }

  private parseCsv(buffer: Buffer): Record<string, string>[] {
    try {
      return parse(buffer, { columns: true, trim: true, skip_empty_lines: true }) as Record<string, string>[];
    } catch {
      return [];
    }
  }

  private parseRow(raw: Record<string, string>, row: number): { parsed: ParsedRow } | { error: string } {
    const sku = (raw.sku ?? '').trim();
    if (!sku) {
      return { error: 'Coluna sku vazia' };
    }

    const universal = TRUE_VALUES.has((raw.universal ?? '').trim().toLowerCase());

    const brandName = (raw.marca ?? '').trim();
    const modelName = (raw.modelo ?? '').trim();
    if (!universal && (!brandName || !modelName)) {
      return { error: 'marca e modelo sao obrigatorios quando universal nao esta marcado' };
    }

    const yearFromRaw = (raw.ano_de ?? '').trim();
    const yearToRaw = (raw.ano_ate ?? '').trim();
    const yearFrom = yearFromRaw ? Number(yearFromRaw) : null;
    const yearTo = yearToRaw ? Number(yearToRaw) : null;
    if (yearFromRaw && Number.isNaN(yearFrom)) {
      return { error: 'ano_de invalido' };
    }
    if (yearToRaw && Number.isNaN(yearTo)) {
      return { error: 'ano_ate invalido' };
    }
    if (yearFrom !== null && yearTo !== null && yearFrom > yearTo) {
      return { error: 'ano_de nao pode ser maior que ano_ate' };
    }

    return { parsed: { row, sku, universal, brandName, modelName, yearFrom, yearTo } };
  }
}
