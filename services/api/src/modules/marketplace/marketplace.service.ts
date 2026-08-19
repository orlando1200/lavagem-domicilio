import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CatalogTarget, Prisma, ProductStatus, StoreStatus } from '@prisma/client';
import {
  AdminListProductsDto,
  CatalogQueryDto,
  CheckoutDto,
  ReplaceFitmentsDto,
  UpdateProductStatusDto,
  UpdateStoreStatusDto,
} from './dto/marketplace.dto';
import { FitmentRule, matchFitment, ResolvedVehicle } from './fitment-matching.util';

const CHECKOUT_ORDER_INCLUDE = {
  items: { include: { product: true } },
  store: { select: { id: true, name: true } },
} satisfies Prisma.ProductOrderInclude;

/** Mesma regra simbolica ja usada client-side hoje (cart_provider.dart):
 * frete gratis a partir de R$150, senao R$14,90 fixo. Movida pro
 * servidor no checkout pra nao deixar o cliente forjar o total — nao ha
 * calculo real de frete definido em nenhum outro lugar do produto (ver
 * decisao em docs/PROGRESSO.md sobre MapsService nao estar ligado ao
 * frete de `deliveries`). */
const FREE_SHIPPING_THRESHOLD = 150;
const FLAT_SHIPPING_FEE = 14.9;

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Catalogo visivel para CLIENTE final: produtos ativos, aprovados, de
   * lojas ativas, com catalogTarget CLIENTE ou AMBOS.
   */
  async getClientCatalog(query: CatalogQueryDto) {
    return this.getCatalogForTarget(CatalogTarget.CLIENTE, query);
  }

  /**
   * Catalogo visivel para LAVADOR (compra de insumos/produtos): produtos
   * ativos, aprovados, de lojas ativas, com catalogTarget LAVADOR ou AMBOS.
   */
  async getDriverCatalog(query: CatalogQueryDto) {
    return this.getCatalogForTarget(CatalogTarget.LAVADOR, query);
  }

  private async getCatalogForTarget(
    target: CatalogTarget,
    query: CatalogQueryDto,
  ) {
    const limit = query.limit ?? 20;

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.active,
        store: { status: StoreStatus.active },
        OR: [{ catalogTarget: target }, { catalogTarget: CatalogTarget.AMBOS }],
        ...(query.category ? { category: query.category } : {}),
        ...(query.search
          ? { name: { contains: query.search, mode: 'insensitive' } }
          : {}),
      },
      include: {
        store: {
          select: { id: true, name: true, storeType: true, logisticsPlan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, limit) : products;

    const vehicle = await this.resolveVehicle(query.vehicleId);
    const withCompatibility = await this.attachCompatibility(items, vehicle);

    return {
      items: withCompatibility,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async getProductById(id: string, vehicleId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            storeType: true,
            logisticsPlan: true,
            status: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }

    // Protecao ao comprador: produtos nao aprovados ou de lojas inativas
    // nao devem ser expostos fora do painel administrativo.
    if (
      product.status !== ProductStatus.active ||
      product.store.status !== StoreStatus.active
    ) {
      throw new NotFoundException('Produto nao encontrado');
    }

    const vehicle = await this.resolveVehicle(vehicleId);
    const [withCompatibility] = await this.attachCompatibility([product], vehicle);
    return withCompatibility;
  }

  // ────────────────────────────────────────────────────────────────────
  // FITMENT (compatibilidade produto x veiculo)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Resolve o veiculo (marca/modelo/ano) a partir do catalogo — null
   * quando nao informado ou quando o veiculo nao tem `catalogYearId`
   * (cadastro livre, sem vinculo com o catalogo estruturado).
   */
  private async resolveVehicle(vehicleId?: string): Promise<ResolvedVehicle | null> {
    if (!vehicleId) {
      return null;
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { catalogYear: { include: { model: true } } },
    });

    if (!vehicle?.catalogYear) {
      return null;
    }

    return {
      brandId: vehicle.catalogYear.model.brandId,
      modelId: vehicle.catalogYear.modelId,
      year: vehicle.catalogYear.year,
    };
  }

  /**
   * Anota `compatibility` em cada produto — busca as regras de fitment
   * em lote (uma query pra pagina toda, nao uma por produto) e computa
   * em memoria via `matchFitment` (helper puro, testado isoladamente).
   */
  private async attachCompatibility<T extends { id: string }>(
    products: T[],
    vehicle: ResolvedVehicle | null,
  ): Promise<Array<T & { compatibility: string }>> {
    if (products.length === 0) {
      return [];
    }

    const fitments = await this.prisma.productFitment.findMany({
      where: { productId: { in: products.map((p) => p.id) } },
      select: { productId: true, universal: true, brandId: true, modelId: true, yearFrom: true, yearTo: true },
    });

    const rulesByProduct = new Map<string, FitmentRule[]>();
    for (const fitment of fitments) {
      const list = rulesByProduct.get(fitment.productId) ?? [];
      list.push({
        universal: fitment.universal,
        brandId: fitment.brandId,
        modelId: fitment.modelId,
        yearFrom: fitment.yearFrom,
        yearTo: fitment.yearTo,
      });
      rulesByProduct.set(fitment.productId, list);
    }

    return products.map((product) => ({
      ...product,
      compatibility: matchFitment(vehicle, rulesByProduct.get(product.id) ?? []),
    }));
  }

  async listProductFitments(productId: string) {
    await this.findProductOrThrow(productId);

    return this.prisma.productFitment.findMany({
      where: { productId },
      include: { brand: true, model: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Substitui todo o conjunto de regras de um produto numa transacao —
   * mais simples e previsivel que diffear linha a linha.
   */
  async replaceProductFitments(productId: string, dto: ReplaceFitmentsDto) {
    await this.findProductOrThrow(productId);

    for (const rule of dto.fitments) {
      if (!rule.universal && !rule.modelId) {
        throw new BadRequestException('Cada regra precisa ser universal ou informar um modelo');
      }
      if (rule.yearFrom && rule.yearTo && rule.yearFrom > rule.yearTo) {
        throw new BadRequestException('yearFrom nao pode ser maior que yearTo');
      }
    }

    await this.prisma.$transaction([
      this.prisma.productFitment.deleteMany({ where: { productId } }),
      ...(dto.fitments.length
        ? [
            this.prisma.productFitment.createMany({
              data: dto.fitments.map((rule) => ({
                productId,
                universal: rule.universal ?? false,
                brandId: rule.universal ? null : rule.brandId,
                modelId: rule.universal ? null : rule.modelId,
                yearFrom: rule.universal ? null : rule.yearFrom,
                yearTo: rule.universal ? null : rule.yearTo,
              })),
            }),
          ]
        : []),
    ]);

    return this.listProductFitments(productId);
  }

  async removeProductFitment(productId: string, fitmentId: string) {
    const fitment = await this.prisma.productFitment.findUnique({ where: { id: fitmentId } });
    if (!fitment || fitment.productId !== productId) {
      throw new NotFoundException('Compatibilidade nao encontrada para este produto');
    }

    await this.prisma.productFitment.delete({ where: { id: fitmentId } });
    return { message: 'Compatibilidade removida.' };
  }

  private async findProductOrThrow(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }
    return product;
  }

  // ────────────────────────────────────────────────────────────────────
  // CHECKOUT (cliente)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Finaliza a compra do carrinho: cria um `ProductOrder` por loja
   * (schema forca 1 loja por pedido — carrinho com produtos de lojas
   * diferentes vira N pedidos), decrementando estoque de forma
   * transacional e calculando a comissao via `Store.commissionPlan`.
   */
  async checkout(buyerUserId: string, dto: CheckoutDto) {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(
        'Itens duplicados no carrinho: agrupe as quantidades por produto',
      );
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { store: { include: { commissionPlan: true } } },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('Um ou mais produtos do carrinho nao foram encontrados');
    }
    const productById = new Map(products.map((product) => [product.id, product]));

    for (const item of dto.items) {
      const product = productById.get(item.productId)!;
      if (product.status !== ProductStatus.active || product.store.status !== StoreStatus.active) {
        throw new BadRequestException(`Produto "${product.name}" nao esta disponivel para compra`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para "${product.name}" (disponivel: ${product.stockQuantity})`,
        );
      }
      if (!product.store.commissionPlan) {
        throw new BadRequestException(
          `Loja de "${product.name}" nao possui plano de comissao configurado`,
        );
      }
    }

    const itemsByStore = new Map<string, typeof dto.items>();
    for (const item of dto.items) {
      const storeId = productById.get(item.productId)!.storeId;
      itemsByStore.set(storeId, [...(itemsByStore.get(storeId) ?? []), item]);
    }

    const shippingAddress = dto.shippingAddress as unknown as Prisma.InputJsonValue;

    const orders = await this.prisma.$transaction(async (tx) => {
      const created = [];
      let orderIndex = 0;

      for (const [storeId, items] of itemsByStore) {
        const orderItems = items.map((item) => {
          const product = productById.get(item.productId)!;
          return {
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: product.price.mul(item.quantity),
          };
        });

        const subtotal = orderItems.reduce(
          (sum, item) => sum.add(item.totalPrice),
          new Prisma.Decimal(0),
        );
        const subtotalNumber = Number(subtotal);
        const shippingAmount = new Prisma.Decimal(
          subtotalNumber >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE,
        );
        const takeRate = Number(productById.get(items[0].productId)!.store.commissionPlan!.takeRate);
        const commissionAmount = new Prisma.Decimal(Number((subtotalNumber * takeRate).toFixed(2)));
        const totalAmount = subtotal.add(shippingAmount);

        for (const item of items) {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new ConflictException(
              `Estoque de "${productById.get(item.productId)!.name}" mudou, tente novamente`,
            );
          }
        }

        created.push(
          await tx.productOrder.create({
            data: {
              orderNumber: this.buildOrderNumber(orderIndex),
              buyerUserId,
              storeId,
              subtotal,
              shippingAmount,
              commissionAmount,
              totalAmount,
              shippingAddress,
              items: { create: orderItems },
            },
            include: CHECKOUT_ORDER_INCLUDE,
          }),
        );
        orderIndex += 1;
      }

      return created;
    });

    return { orders };
  }

  private buildOrderNumber(index: number): string {
    return `PED-${Date.now().toString(36).toUpperCase()}-${index}`;
  }

  /** Lista produtos de todas as lojas pro admin, com filtro de status
   * (usado principalmente pra fila de aprovacao: status=pending_approval). */
  async listProductsForAdmin(query: AdminListProductsDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.storeId ? { storeId: query.storeId } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listStoresForAdmin() {
    return this.prisma.store.findMany({
      include: {
        commissionPlan: true,
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStoreStatus(storeId: string, dto: UpdateStoreStatusDto) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: dto.status },
    });
  }

  async updateProductStatus(productId: string, dto: UpdateProductStatusDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produto nao encontrado');
    }

    if (dto.status === ProductStatus.rejected && !dto.rejectionReason) {
      throw new BadRequestException(
        'rejectionReason e obrigatorio ao rejeitar um produto',
      );
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        status: dto.status,
        rejectionReason:
          dto.status === ProductStatus.rejected ? dto.rejectionReason : null,
        approvedAt: dto.status === ProductStatus.active ? new Date() : null,
      },
    });
  }
}
