import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { getCommissionRate } from './store.constants';
import { LogisticsPlan, Prisma, ProductStatus, UserRole } from '@prisma/client';

const PRODUCT_ORDER_INCLUDE = {
  items: { include: { product: true } },
  buyer: { select: { id: true, name: true } },
} satisfies Prisma.ProductOrderInclude;

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(ownerUserId: string, dto: CreateStoreDto) {
    const existing = await this.prisma.store.findUnique({
      where: { ownerUserId },
    });

    if (existing) {
      throw new ConflictException('Este usuario ja possui uma loja cadastrada');
    }

    const logisticsPlan = dto.logisticsPlan ?? LogisticsPlan.INTEGRATED;
    const rate = getCommissionRate(dto.storeType, logisticsPlan);

    return this.prisma.store.create({
      data: {
        ownerUserId,
        name: dto.name,
        document: dto.document,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        storeType: dto.storeType,
        logisticsPlan,
        address: dto.address as Prisma.InputJsonValue,
        bankInfo: dto.bankInfo as Prisma.InputJsonValue,
        commissionPlan: {
          create: {
            storeType: dto.storeType,
            logisticsPlan,
            monthlyFee: rate.monthlyFee,
            takeRate: rate.takeRate,
          },
        },
      },
      include: { commissionPlan: true },
    });
  }

  /**
   * Le a loja e confere que quem pediu e o dono (ou admin) — as rotas
   * de `:id` deste modulo (produtos, pedidos, dados da loja incluindo
   * `bankInfo`/`commissionPlan`) sao todas de gestao do proprio
   * lojista, nunca de vitrine publica (isso e o modulo `marketplace`).
   */
  async findStoreForOwner(id: string, requester: { id: string; role: UserRole }) {
    const store = await this.findStoreById(id);

    if (store.ownerUserId !== requester.id && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Voce nao tem acesso a esta loja');
    }

    return store;
  }

  async findStoreById(id: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: { commissionPlan: true },
    });

    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }

    return store;
  }

  async listStores() {
    return this.prisma.store.findMany({
      include: { commissionPlan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(
    storeId: string,
    requester: { id: string; role: UserRole },
    dto: CreateStoreProductDto,
  ) {
    await this.findStoreForOwner(storeId, requester);

    const slug = this.buildSlug(dto.name);

    return this.prisma.product.create({
      data: {
        storeId,
        name: dto.name,
        slug,
        description: dto.description,
        sku: dto.sku,
        category: dto.category,
        price: dto.price,
        stockQuantity: dto.stockQuantity ?? 0,
        catalogTarget: dto.catalogTarget,
        weightGrams: dto.weightGrams,
        status: ProductStatus.pending_approval,
      },
    });
  }

  async listProductsByStore(storeId: string, requester: { id: string; role: UserRole }) {
    await this.findStoreForOwner(storeId, requester);

    return this.prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Pedidos de produto recebidos pela loja (POST /marketplace/client/checkout). */
  async listOrdersByStore(storeId: string, requester: { id: string; role: UserRole }) {
    await this.findStoreForOwner(storeId, requester);

    return this.prisma.productOrder.findMany({
      where: { storeId },
      include: PRODUCT_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }
}
