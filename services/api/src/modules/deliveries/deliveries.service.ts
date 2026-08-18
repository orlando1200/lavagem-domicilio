import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductOrderDeliveryStatus, ProductOrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminCreateDeliveryDto,
  ListDeliveriesDto,
  UpdateDeliveryStatusDto,
} from './dto/deliveries.dto';

const DELIVERY_INCLUDE = {
  buyer: { select: { id: true, name: true, email: true, phone: true } },
  buyerWasher: true,
  store: { select: { id: true, name: true, storeType: true, logisticsPlan: true } },
  deliveryDriver: true,
  items: { include: { product: true } },
} satisfies Prisma.ProductOrderInclude;

/**
 * Transicoes de status permitidas para o fluxo logistico de entrega
 * (independente do `ProductOrderStatus` comercial).
 */
const ALLOWED_DELIVERY_TRANSITIONS: Record<
  ProductOrderDeliveryStatus,
  ProductOrderDeliveryStatus[]
> = {
  PENDING: [ProductOrderDeliveryStatus.ACCEPTED, ProductOrderDeliveryStatus.CANCELLED],
  ACCEPTED: [ProductOrderDeliveryStatus.ON_THE_WAY, ProductOrderDeliveryStatus.CANCELLED],
  ON_THE_WAY: [ProductOrderDeliveryStatus.DELIVERED, ProductOrderDeliveryStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // LAVADOR (ENTREGADOR)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Lista entregas disponiveis/pendentes para lavadores aceitarem
   * (`deliveryStatus = PENDING`, ainda sem entregador atribuido).
   */
  async listAvailableDeliveries(query: ListDeliveriesDto) {
    const limit = query.limit ?? 20;

    const deliveries = await this.prisma.productOrder.findMany({
      where: {
        deliveryStatus: query.status ?? ProductOrderDeliveryStatus.PENDING,
        deliveryDriverId: null,
      },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = deliveries.length > limit;
    const items = hasMore ? deliveries.slice(0, limit) : deliveries;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  /** Entrega ativa (nao finalizada) do lavador-entregador autenticado. */
  async getActiveDelivery(driverUserId: string) {
    const active = await this.prisma.productOrder.findFirst({
      where: {
        deliveryDriverId: driverUserId,
        deliveryStatus: {
          in: [ProductOrderDeliveryStatus.ACCEPTED, ProductOrderDeliveryStatus.ON_THE_WAY],
        },
      },
      include: DELIVERY_INCLUDE,
      orderBy: { assignedAt: 'desc' },
    });

    return active;
  }

  /**
   * Lavador aceita uma entrega pendente. So permite aceite se a entrega
   * ainda estiver `PENDING` e sem entregador atribuido, e se o lavador
   * nao tiver outra entrega ativa no momento.
   */
  async acceptDelivery(driverUserId: string, deliveryId: string) {
    const delivery = await this.findDeliveryOrThrow(deliveryId);

    if (
      delivery.deliveryStatus !== ProductOrderDeliveryStatus.PENDING ||
      delivery.deliveryDriverId
    ) {
      throw new BadRequestException(
        `Entrega nao esta disponivel para aceite (status atual: ${delivery.deliveryStatus})`,
      );
    }

    const existingActive = await this.getActiveDelivery(driverUserId);
    if (existingActive) {
      throw new BadRequestException(
        'Voce ja possui uma entrega em andamento. Conclua-a antes de aceitar outra.',
      );
    }

    return this.prisma.productOrder.update({
      where: { id: deliveryId },
      data: {
        deliveryDriverId: driverUserId,
        deliveryStatus: ProductOrderDeliveryStatus.ACCEPTED,
        assignedAt: new Date(),
      },
      include: DELIVERY_INCLUDE,
    });
  }

  /** Lavador avanca o status da propria entrega (ex.: ON_THE_WAY -> DELIVERED). */
  async updateDeliveryStatus(
    driverUserId: string,
    deliveryId: string,
    dto: UpdateDeliveryStatusDto,
  ) {
    const delivery = await this.findDeliveryOrThrow(deliveryId);

    if (delivery.deliveryDriverId !== driverUserId) {
      throw new ForbiddenException('Esta entrega nao esta atribuida a este lavador');
    }

    return this.transitionDeliveryStatus(delivery, dto.status);
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────

  /**
   * Cria uma entrega (ProductOrder com deliveryStatus = PENDING) para
   * simular/testar o fluxo de "Entregas Loja do Lavador" sem depender do
   * checkout completo do marketplace.
   */
  async createDeliveryAsAdmin(dto: AdminCreateDeliveryDto) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((item) => item.productId) } },
    });

    if (products.length !== dto.items.length) {
      throw new NotFoundException('Um ou mais produtos informados nao foram encontrados');
    }

    const productById = new Map(products.map((product) => [product.id, product]));

    const orderItems = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const quantity = item.quantity ?? 1;
      const unitPrice = product.price;
      return {
        productId: product.id,
        quantity,
        unitPrice,
        totalPrice: unitPrice.mul(quantity),
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0),
    );
    const shippingAmount = new Prisma.Decimal(dto.shippingAmount ?? 0);
    const totalAmount = subtotal.add(shippingAmount);

    return this.prisma.productOrder.create({
      data: {
        orderNumber: this.buildOrderNumber(),
        buyerUserId: dto.buyerUserId,
        buyerWasherId: dto.buyerWasherId,
        storeId: dto.storeId,
        subtotal,
        shippingAmount,
        totalAmount,
        deliveryStatus: ProductOrderDeliveryStatus.PENDING,
        items: { create: orderItems },
      },
      include: DELIVERY_INCLUDE,
    });
  }

  async listAllDeliveriesAsAdmin(query: ListDeliveriesDto) {
    const limit = query.limit ?? 20;

    const deliveries = await this.prisma.productOrder.findMany({
      where: { ...(query.status ? { deliveryStatus: query.status } : {}) },
      include: DELIVERY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = deliveries.length > limit;
    const items = hasMore ? deliveries.slice(0, limit) : deliveries;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findDeliveryOrThrow(deliveryId: string) {
    const delivery = await this.prisma.productOrder.findUnique({
      where: { id: deliveryId },
      include: DELIVERY_INCLUDE,
    });

    if (!delivery) {
      throw new NotFoundException('Entrega nao encontrada');
    }

    return delivery;
  }

  private async transitionDeliveryStatus(
    delivery: { id: string; deliveryStatus: ProductOrderDeliveryStatus },
    newStatus: ProductOrderDeliveryStatus,
  ) {
    if (delivery.deliveryStatus === newStatus) {
      return this.findDeliveryOrThrow(delivery.id);
    }

    const allowed = ALLOWED_DELIVERY_TRANSITIONS[delivery.deliveryStatus].includes(newStatus);
    if (!allowed) {
      throw new BadRequestException(
        `Transicao de status de entrega invalida: ${delivery.deliveryStatus} -> ${newStatus}`,
      );
    }

    return this.prisma.productOrder.update({
      where: { id: delivery.id },
      data: {
        deliveryStatus: newStatus,
        ...(newStatus === ProductOrderDeliveryStatus.DELIVERED
          ? { deliveredAt: new Date(), status: ProductOrderStatus.delivered }
          : {}),
      },
      include: DELIVERY_INCLUDE,
    });
  }

  private buildOrderNumber(): string {
    return `DLV-${Date.now().toString(36).toUpperCase()}`;
  }
}
