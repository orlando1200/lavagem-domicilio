import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PayoutRecipientType,
  PayoutStatus,
  Prisma,
  ProductOrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  GenerateStorePayoutDto,
  GenerateWasherPayoutDto,
  ListPayoutsQueryDto,
  UpdatePayoutStatusDto,
} from './dto/payouts.dto';

const PAYOUT_INCLUDE = {
  recipientWasher: { include: { user: true } },
  recipientStore: true,
} satisfies Prisma.PayoutInclude;

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // GERACAO DE REPASSE
  // ────────────────────────────────────────────────────────────────────

  /**
   * Apura o repasse de um lavador em um periodo com base nas orders de
   * servico (`Order`) concluidas (`status = completed`). O schema atual
   * nao possui uma taxa de comissao de plataforma para o lavador (diferente
   * de `CommissionPlan.takeRate`, que e especifico de lojista), entao a
   * taxa e informada na requisicao (default 0%).
   */
  async generateWasherPayout(dto: GenerateWasherPayoutDto) {
    const washer = await this.prisma.washer.findUnique({
      where: { userId: dto.washerId },
    });
    if (!washer) {
      throw new NotFoundException('Lavador nao encontrado');
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    this.assertValidPeriod(periodStart, periodEnd);

    const orders = await this.prisma.order.findMany({
      where: {
        washerId: dto.washerId,
        status: OrderStatus.completed,
        completedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const grossAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const commissionRate = (dto.commissionRate ?? 0) / 100;
    const commissionAmount = grossAmount * commissionRate;
    const netAmount = grossAmount - commissionAmount;

    return this.prisma.payout.create({
      data: {
        recipientType: PayoutRecipientType.WASHER,
        recipientWasherId: dto.washerId,
        periodStart,
        periodEnd,
        ordersCount: orders.length,
        grossAmount,
        commissionAmount,
        netAmount,
        status: PayoutStatus.pending,
      },
      include: PAYOUT_INCLUDE,
    });
  }

  /**
   * Apura o repasse de uma loja em um periodo com base nos pedidos de
   * produto (`ProductOrder`) entregues (`status = delivered`). A comissao
   * ja e calculada por pedido (`ProductOrder.commissionAmount`, definida
   * pelo `CommissionPlan` da loja), entao aqui apenas somamos.
   */
  async generateStorePayout(dto: GenerateStorePayoutDto) {
    const store = await this.prisma.store.findUnique({ where: { id: dto.storeId } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    this.assertValidPeriod(periodStart, periodEnd);

    const productOrders = await this.prisma.productOrder.findMany({
      where: {
        storeId: dto.storeId,
        status: ProductOrderStatus.delivered,
        updatedAt: { gte: periodStart, lte: periodEnd },
      },
    });

    const grossAmount = productOrders.reduce(
      (sum, po) => sum + Number(po.totalAmount),
      0,
    );
    const commissionAmount = productOrders.reduce(
      (sum, po) => sum + Number(po.commissionAmount),
      0,
    );
    const netAmount = grossAmount - commissionAmount;

    return this.prisma.payout.create({
      data: {
        recipientType: PayoutRecipientType.STORE,
        recipientStoreId: dto.storeId,
        periodStart,
        periodEnd,
        ordersCount: productOrders.length,
        grossAmount,
        commissionAmount,
        netAmount,
        status: PayoutStatus.pending,
      },
      include: PAYOUT_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // CONSULTA E GESTAO (ADMIN)
  // ────────────────────────────────────────────────────────────────────

  async listPayouts(query: ListPayoutsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.PayoutWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.washerId ? { recipientWasherId: query.washerId } : {}),
      ...(query.storeId ? { recipientStoreId: query.storeId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: PAYOUT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPayoutById(id: string) {
    return this.findPayoutOrThrow(id);
  }

  async updatePayoutStatus(id: string, dto: UpdatePayoutStatusDto) {
    const payout = await this.findPayoutOrThrow(id);

    if (payout.status === PayoutStatus.paid) {
      throw new BadRequestException('Repasse ja foi pago e nao pode ser alterado');
    }
    if (dto.status === PayoutStatus.rejected && !dto.rejectionReason) {
      throw new BadRequestException('Informe o motivo da rejeicao');
    }

    const now = new Date();

    return this.prisma.payout.update({
      where: { id },
      data: {
        status: dto.status,
        rejectionReason: dto.status === PayoutStatus.rejected ? dto.rejectionReason : undefined,
        providerReference: dto.providerReference,
        approvedAt: dto.status === PayoutStatus.approved ? now : payout.approvedAt,
        paidAt: dto.status === PayoutStatus.paid ? now : payout.paidAt,
      },
      include: PAYOUT_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // CONSULTA (PROPRIO LAVADOR / LOJISTA)
  // ────────────────────────────────────────────────────────────────────

  async listMyWasherPayouts(washerId: string) {
    return this.prisma.payout.findMany({
      where: { recipientWasherId: washerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyStorePayouts(ownerUserId: string) {
    const store = await this.prisma.store.findUnique({ where: { ownerUserId } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada para este usuario');
    }
    return this.prisma.payout.findMany({
      where: { recipientStoreId: store.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findPayoutOrThrow(id: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id },
      include: PAYOUT_INCLUDE,
    });
    if (!payout) {
      throw new NotFoundException('Repasse nao encontrado');
    }
    return payout;
  }

  private assertValidPeriod(start: Date, end: Date) {
    if (start.getTime() >= end.getTime()) {
      throw new BadRequestException('periodStart deve ser anterior a periodEnd');
    }
  }
}
