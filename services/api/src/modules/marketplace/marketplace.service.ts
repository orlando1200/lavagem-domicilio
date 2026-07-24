import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CatalogTarget, ProductStatus, StoreStatus } from '@prisma/client';
import { CatalogQueryDto, UpdateProductStatusDto } from './dto/marketplace.dto';

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

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async getProductById(id: string) {
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

    return product;
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
