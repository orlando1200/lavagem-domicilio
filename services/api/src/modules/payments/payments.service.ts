import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { PAYMENT_GATEWAY_ADAPTER, PaymentGatewayAdapter } from './adapters/payment-gateway.interface';
import { CreatePaymentIntentDto, PaymentWebhookDto } from './dto/payments.dto';

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
    @Inject(PAYMENT_GATEWAY_ADAPTER) private readonly gateway: PaymentGatewayAdapter,
  ) {}

  async createIntent(userId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order || order.customerId !== userId) {
      throw new NotFoundException('Pedido nao encontrado para este cliente');
    }

    const existing = await this.prisma.payment.findUnique({ where: { orderId: dto.orderId } });
    if (existing) {
      throw new ConflictException('Este pedido ja possui um pagamento em andamento');
    }

    const externalRef = `order_${order.id}`;
    const intent = await this.gateway.createIntent({
      amount: Number(order.totalAmount),
      method: dto.method,
      externalRef,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        method: dto.method,
        status: PaymentStatus.pending,
        amount: order.totalAmount,
        externalRef: intent.externalRef,
      },
    });

    return { payment, gateway: intent };
  }

  async getMyPayment(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
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
      await this.grantLoyaltyPointsBestEffort(payment.orderId);
    }

    return updated;
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
}
