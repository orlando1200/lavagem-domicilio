import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma, ProductOrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PAYMENT_GATEWAY_ADAPTER, PaymentGatewayAdapter } from './adapters/payment-gateway.interface';
import {
  AdminListPaymentsQueryDto,
  AdminPaymentsReportQueryDto,
  CreatePaymentIntentDto,
  PaymentWebhookDto,
} from './dto/payments.dto';

const PAYMENT_ADMIN_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentInclude;

const WEBHOOK_STATUS_MAP: Record<PaymentWebhookDto['status'], PaymentStatus> = {
  approved: PaymentStatus.paid,
  rejected: PaymentStatus.failed,
  pending: PaymentStatus.pending,
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly notificationsService: NotificationsService,
    @Inject(PAYMENT_GATEWAY_ADAPTER) private readonly gateway: PaymentGatewayAdapter,
  ) {}

  async createIntent(userId: string, dto: CreatePaymentIntentDto) {
    if ((dto.orderId && dto.productOrderId) || (!dto.orderId && !dto.productOrderId)) {
      throw new BadRequestException('Informe exatamente um entre orderId e productOrderId');
    }

    return dto.orderId
      ? this.createIntentForOrder(userId, dto.orderId, dto.method)
      : this.createIntentForProductOrder(userId, dto.productOrderId!, dto.method);
  }

  private async createIntentForOrder(userId: string, orderId: string, method: PaymentMethod) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== userId) {
      throw new NotFoundException('Pedido nao encontrado para este cliente');
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId } });
    if (existing) {
      throw new ConflictException('Este pedido ja possui um pagamento em andamento');
    }

    const externalRef = `order_${order.id}`;
    const intent = await this.gateway.createIntent({
      amount: Number(order.totalAmount),
      method,
      externalRef,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        method,
        status: PaymentStatus.pending,
        amount: order.totalAmount,
        externalRef: intent.externalRef,
      },
    });

    return { payment, gateway: intent };
  }

  private async createIntentForProductOrder(
    userId: string,
    productOrderId: string,
    method: PaymentMethod,
  ) {
    const productOrder = await this.prisma.productOrder.findUnique({
      where: { id: productOrderId },
    });
    if (!productOrder || productOrder.buyerUserId !== userId) {
      throw new NotFoundException('Pedido nao encontrado para este cliente');
    }

    const existing = await this.prisma.payment.findUnique({ where: { productOrderId } });
    if (existing) {
      throw new ConflictException('Este pedido ja possui um pagamento em andamento');
    }

    const externalRef = `product_order_${productOrder.id}`;
    const intent = await this.gateway.createIntent({
      amount: Number(productOrder.totalAmount),
      method,
      externalRef,
    });

    const payment = await this.prisma.payment.create({
      data: {
        productOrderId: productOrder.id,
        userId,
        method,
        status: PaymentStatus.pending,
        amount: productOrder.totalAmount,
        externalRef: intent.externalRef,
      },
    });

    return { payment, gateway: intent };
  }

  listMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyPayment(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Pagamento nao encontrado');
    }
    return payment;
  }

  async getMyPaymentForProductOrder(userId: string, productOrderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { productOrderId } });
    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Pagamento nao encontrado');
    }
    return payment;
  }

  /**
   * Callback do gateway (mock). Sem autenticacao de proposito — um
   * gateway de pagamento de verdade nao manda Bearer token do nosso app.
   * Uma integracao real com o Mercado Pago precisaria validar a
   * assinatura do webhook (header `x-signature`); nao implementado aqui
   * por falta de credenciais reais pra testar contra.
   */
  async handleWebhook(dto: PaymentWebhookDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalRef: dto.externalRef },
    });
    if (!payment) {
      throw new NotFoundException('Pagamento nao encontrado para esta referencia externa');
    }

    const newStatus = WEBHOOK_STATUS_MAP[dto.status];
    const wasAlreadyPaid = payment.status === PaymentStatus.paid;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    if (newStatus === PaymentStatus.paid && !wasAlreadyPaid) {
      if (payment.orderId) {
        await this.grantLoyaltyPointsBestEffort(payment.orderId);
      } else if (payment.productOrderId) {
        await this.confirmProductOrderPaymentBestEffort(payment.productOrderId);
      }
      await this.notifyPaymentConfirmedBestEffort(payment.userId, payment.id);
    }

    return updated;
  }

  private async notifyPaymentConfirmedBestEffort(userId: string, paymentId: string) {
    try {
      await this.notificationsService.create(userId, {
        type: 'payment_confirmed',
        title: 'Pagamento confirmado',
        body: 'Recebemos a confirmacao do seu pagamento.',
        relatedEntityId: paymentId,
      });
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel notificar o pagamento confirmado ${paymentId}: ${(error as Error).message}`,
      );
    }
  }

  private async grantLoyaltyPointsBestEffort(orderId: string) {
    try {
      await this.loyaltyService.grantForPaidOrder(orderId);
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel conceder pontos GIUCAR para o pedido ${orderId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Confirma o pagamento de um pedido de produto (loja). Sem concessao
   * de pontos de fidelidade — fidelidade GIUCAR e exclusiva do pedido
   * de lavagem (`Order`), por decisao de escopo.
   */
  private async confirmProductOrderPaymentBestEffort(productOrderId: string) {
    try {
      await this.prisma.productOrder.update({
        where: { id: productOrderId },
        data: { paymentStatus: PaymentStatus.paid, status: ProductOrderStatus.confirmed },
      });
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel confirmar o pagamento do pedido de produto ${productOrderId}: ${(error as Error).message}`,
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // RELATORIOS FINANCEIROS (ADMIN)
  // ────────────────────────────────────────────────────────────────────

  private buildAdminWhere(
    query: AdminListPaymentsQueryDto | AdminPaymentsReportQueryDto,
  ): Prisma.PaymentWhereInput {
    return {
      ...(query.status ? { status: query.status } : {}),
      ...(query.method ? { method: query.method } : {}),
      ...('userId' in query && query.userId ? { userId: query.userId } : {}),
      ...('search' in query && query.search
        ? { externalRef: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };
  }

  async listPaymentsAsAdmin(query: AdminListPaymentsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const where = this.buildAdminWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: PAYMENT_ADMIN_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPaymentsReportAsAdmin(query: AdminPaymentsReportQueryDto) {
    const where = this.buildAdminWhere(query);

    const [totalAgg, byStatus, byMethod] = await Promise.all([
      this.prisma.payment.aggregate({ where, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return {
      totalAmount: totalAgg._sum.amount ?? 0,
      totalCount: totalAgg._count._all,
      byStatus: byStatus.map((g) => ({
        status: g.status,
        amount: g._sum.amount ?? 0,
        count: g._count._all,
      })),
      byMethod: byMethod.map((g) => ({
        method: g.method,
        amount: g._sum.amount ?? 0,
        count: g._count._all,
      })),
    };
  }

  /**
   * Exportacao pra CSV: sem paginacao, capado em 5000 linhas (escala
   * suficiente pra um admin baixar e abrir em planilha; sem lib de CSV
   * nova — o frontend converte o JSON puro).
   */
  async exportPaymentsAsAdmin(query: AdminPaymentsReportQueryDto) {
    const where = this.buildAdminWhere(query);
    return this.prisma.payment.findMany({
      where,
      include: PAYMENT_ADMIN_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });
  }
}
