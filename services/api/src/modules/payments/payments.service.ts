import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaymentMethod, PaymentStatus, ProductOrderStatus } from '@prisma/client';
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
}
