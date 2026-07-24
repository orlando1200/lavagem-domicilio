import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { getCommissionRate } from './store.constants';
import { LogisticsPlan, ProductStatus } from '@prisma/client';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async createStore(dto: CreateStoreDto) {
    const existing = await this.prisma.store.findUnique({
      where: { ownerUserId: dto.ownerUserId },
    });

    if (existing) {
      throw new ConflictException('Este usuario ja possui uma loja cadastrada');
    }

    const logisticsPlan = dto.logisticsPlan ?? LogisticsPlan.INTEGRATED;
    const rate = getCommissionRate(dto.storeType, logisticsPlan);

    return this.prisma.store.create({
      data: {
        ownerUserId: dto.ownerUserId,
        name: dto.name,
        document: dto.document,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        storeType: dto.storeType,
        logisticsPlan,
        address: dto.address,
        bankInfo: dto.bankInfo,
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

  async createProduct(storeId: string, dto: CreateStoreProductDto) {
    await this.findStoreById(storeId);

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

  async listProductsByStore(storeId: string) {
    await this.findStoreById(storeId);

    return this.prisma.product.findMany({
      where: { storeId },
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
