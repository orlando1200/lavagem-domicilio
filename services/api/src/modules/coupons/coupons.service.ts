import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCouponCampaignDto,
  CreateCouponDto,
  ListCouponsQueryDto,
  UpdateCouponCampaignDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // CAMPANHAS (ADMIN)
  // ────────────────────────────────────────────────────────────────────

  async createCampaign(dto: CreateCouponCampaignDto) {
    return this.prisma.couponCampaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listCampaigns() {
    return this.prisma.couponCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCampaign(id: string, dto: UpdateCouponCampaignDto) {
    await this.findCampaignOrThrow(id);

    return this.prisma.couponCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // CUPONS (ADMIN)
  // ────────────────────────────────────────────────────────────────────

  async createCoupon(dto: CreateCouponDto) {
    const codeInUse = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (codeInUse) {
      throw new ConflictException('Ja existe um cupom com este codigo');
    }

    if (dto.campaignId) {
      await this.findCampaignOrThrow(dto.campaignId);
    }

    return this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxUses: dto.maxUses,
        minOrderAmount: dto.minOrderAmount,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive ?? true,
        campaignId: dto.campaignId,
      },
    });
  }

  async listCoupons(query: ListCouponsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.CouponWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        include: { campaign: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCouponById(id: string) {
    return this.findCouponOrThrow(id);
  }

  async updateCoupon(id: string, dto: UpdateCouponDto) {
    await this.findCouponOrThrow(id);

    if (dto.campaignId) {
      await this.findCampaignOrThrow(dto.campaignId);
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.discountType !== undefined ? { discountType: dto.discountType } : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
        ...(dto.maxUses !== undefined ? { maxUses: dto.maxUses } : {}),
        ...(dto.minOrderAmount !== undefined ? { minOrderAmount: dto.minOrderAmount } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: new Date(dto.expiresAt) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.campaignId !== undefined ? { campaignId: dto.campaignId } : {}),
      },
    });
  }

  async deleteCoupon(id: string) {
    await this.findCouponOrThrow(id);
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }

  // ────────────────────────────────────────────────────────────────────
  // VALIDACAO (CLIENTE / LOJISTA) - checkout
  // ────────────────────────────────────────────────────────────────────

  /**
   * Valida um cupom informado no checkout: existencia, ativo, dentro da
   * validade, limite de usos e valor minimo do pedido. Nao efetiva o uso
   * (isso ocorre em `redeem`, chamado apos confirmacao do pagamento).
   */
  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom nao encontrado');
    }
    if (!coupon.isActive) {
      throw new BadRequestException('Cupom inativo');
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Cupom expirado');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom esgotado');
    }
    if (
      coupon.minOrderAmount !== null &&
      Number(coupon.minOrderAmount) > dto.orderAmount
    ) {
      throw new BadRequestException(
        `Pedido minimo de R$ ${Number(coupon.minOrderAmount).toFixed(2)} para usar este cupom`,
      );
    }

    const discountAmount =
      coupon.discountType === 'percent'
        ? (dto.orderAmount * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);

    return {
      coupon,
      discountAmount: Math.min(discountAmount, dto.orderAmount),
    };
  }

  /**
   * Registra o resgate do cupom para um usuario e incrementa o contador
   * de usos. Deve ser chamado apos a confirmacao do pagamento (o valor do
   * pedido ja foi validado anteriormente via `validateCoupon`).
   */
  async redeemCoupon(code: string, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException('Cupom nao encontrado');
    }
    if (!coupon.isActive) {
      throw new BadRequestException('Cupom inativo');
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom esgotado');
    }

    return this.prisma.$transaction([
      this.prisma.couponRedemption.create({
        data: { couponId: coupon.id, userId },
      }),
      this.prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findCouponOrThrow(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!coupon) {
      throw new NotFoundException('Cupom nao encontrado');
    }
    return coupon;
  }

  private async findCampaignOrThrow(id: string) {
    const campaign = await this.prisma.couponCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Campanha de cupom nao encontrada');
    }
    return campaign;
  }
}
