import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListLoyaltyHistoryDto, RedeemLoyaltyPointsDto } from './dto/loyalty.dto';

/**
 * Taxa de concessao: 5% do valor do pedido, expressa em pontos a razao
 * de 5 pontos por real (equivalente a 1 ponto = R$ 0,01), para que o
 * resgate feche exatamente no mesmo valor percentual concedido.
 * Nao ha taxa definida em nenhuma outra parte do produto — assumida aqui
 * como unica fonte de verdade para concessao e resgate.
 */
const EARN_RATE = 0.05;
// Peg fixo (independente de EARN_RATE): 1 ponto = R$ 0,01. So com esse
// peg o resgate total dos pontos de um pedido devolve exatamente
// EARN_RATE do valor original, para qualquer valor de pedido — ver
// testes em test/modules/loyalty/loyalty.service.spec.ts.
const REAL_PER_POINT = 0.01;
const POINTS_PER_REAL = EARN_RATE / REAL_PER_POINT;
const POINTS_EXPIRY_DAYS = 90;

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // CONCESSAO (chamada pelo futuro modulo de payments/webhook quando o
  // pagamento do pedido for confirmado; hoje exposta via admin)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Concede pontos GIUCAR (5% do valor do pedido) ao usuario dono do
   * pedido. Idempotente por pedido: chamar duas vezes para o mesmo
   * `orderId` falha em vez de conceder pontos em dobro.
   */
  async grantForPaidOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    const existing = await this.prisma.loyaltyPoint.findFirst({ where: { orderId } });
    if (existing) {
      throw new ConflictException('Pontos ja foram concedidos para este pedido');
    }

    const amount = Math.round(Number(order.totalAmount) * POINTS_PER_REAL);
    if (amount <= 0) {
      throw new BadRequestException('Pedido nao gera pontos suficientes');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRY_DAYS);

    return this.prisma.loyaltyPoint.create({
      data: {
        userId: order.customerId,
        orderId: order.id,
        amount,
        expiresAt,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // CLIENTE
  // ────────────────────────────────────────────────────────────────────

  /**
   * Saldo disponivel: soma de `amount - redeemedAmount` entre as
   * concessoes ainda nao vencidas do usuario.
   */
  async getBalance(userId: string) {
    const grants = await this.activeGrants(userId);

    const balance = grants.reduce(
      (sum, grant) => sum + Math.max(0, grant.amount - grant.redeemedAmount),
      0,
    );

    const nextExpiring = grants
      .filter((grant) => grant.amount - grant.redeemedAmount > 0)
      .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0];

    return {
      balance,
      balanceValue: this.toReais(balance),
      nextExpiration: nextExpiring
        ? {
            amount: nextExpiring.amount - nextExpiring.redeemedAmount,
            expiresAt: nextExpiring.expiresAt,
          }
        : null,
    };
  }

  async getHistory(userId: string, query: ListLoyaltyHistoryDto) {
    const limit = query.limit ?? 20;

    const [grants, redemptions] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.loyaltyRedemption.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return { grants, redemptions };
  }

  /**
   * Resgata pontos como desconto em um pedido (no maximo um resgate por
   * pedido). Consome as concessoes mais proximas de vencer primeiro, com
   * suporte a consumo parcial de uma concessao.
   */
  async redeemPoints(userId: string, dto: RedeemLoyaltyPointsDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order || order.customerId !== userId) {
      throw new NotFoundException('Pedido nao encontrado para este cliente');
    }

    const existingRedemption = await this.prisma.loyaltyRedemption.findUnique({
      where: { orderId: dto.orderId },
    });
    if (existingRedemption) {
      throw new ConflictException('Este pedido ja teve pontos resgatados');
    }

    const grants = await this.activeGrants(userId);
    const available = grants.reduce(
      (sum, grant) => sum + Math.max(0, grant.amount - grant.redeemedAmount),
      0,
    );

    if (dto.amount > available) {
      throw new BadRequestException(
        `Saldo insuficiente: disponivel ${available}, solicitado ${dto.amount}`,
      );
    }

    let remaining = dto.amount;
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    for (const grant of grants) {
      if (remaining <= 0) break;

      const grantAvailable = grant.amount - grant.redeemedAmount;
      if (grantAvailable <= 0) continue;

      const consumed = Math.min(grantAvailable, remaining);
      const newRedeemedAmount = grant.redeemedAmount + consumed;

      operations.push(
        this.prisma.loyaltyPoint.update({
          where: { id: grant.id },
          data: {
            redeemedAmount: newRedeemedAmount,
            ...(newRedeemedAmount >= grant.amount ? { usedAt: new Date() } : {}),
          },
        }),
      );

      remaining -= consumed;
    }

    operations.push(
      this.prisma.loyaltyRedemption.create({
        data: { userId, orderId: dto.orderId, amount: dto.amount },
      }),
    );

    const results = await this.prisma.$transaction(operations);
    const redemption = results[results.length - 1];

    return { redemption, discountValue: this.toReais(dto.amount) };
  }

  // ────────────────────────────────────────────────────────────────────
  // EXPIRACAO (job noturno)
  // ────────────────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyExpiration() {
    const result = await this.expireOverduePoints();
    this.logger.log(`[loyalty] job noturno: ${result.expiredCount} concessoes expiradas`);
  }

  /**
   * Marca como finalizadas (`usedAt`) as concessoes vencidas e ainda nao
   * totalmente resgatadas — elas ja saem do calculo de saldo por
   * `expiresAt`, isto so fecha o registro para fins de historico/auditoria.
   * Idempotente (`usedAt IS NULL` na condicao), seguro pra chamar mais de
   * uma vez.
   */
  async expireOverduePoints() {
    const result = await this.prisma.loyaltyPoint.updateMany({
      where: { expiresAt: { lt: new Date() }, usedAt: null },
      data: { usedAt: new Date() },
    });

    return { expiredCount: result.count };
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private activeGrants(userId: string) {
    return this.prisma.loyaltyPoint.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  private toReais(points: number): number {
    return Number((points * REAL_PER_POINT).toFixed(2));
  }
}
