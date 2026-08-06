import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, DriverType, Order, OrderStatus, Prisma, ServiceType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminListOrdersDto, ListOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto, UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ORDER_INCLUDE = {
  items: true,
  vehicle: true,
  address: true,
  zone: true,
} satisfies Prisma.OrderInclude;

/** Transicoes de status permitidas (maquina de estados do pedido). */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: [OrderStatus.searching_washer, OrderStatus.cancelled],
  searching_washer: [OrderStatus.accepted, OrderStatus.cancelled],
  accepted: [OrderStatus.en_route, OrderStatus.cancelled],
  en_route: [OrderStatus.in_progress, OrderStatus.cancelled],
  in_progress: [OrderStatus.completed, OrderStatus.cancelled],
  completed: [],
  cancelled: [],
};

/** Raio da Terra em km, usado no calculo de distancia haversine. */
const EARTH_RADIUS_KM = 6371;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // CLIENTE
  // ────────────────────────────────────────────────────────────────────

  /**
   * Cria um novo pedido de lavagem para o cliente autenticado, calcula o
   * valor total a partir dos itens informados e dispara o matching com
   * lavadores disponiveis (assincrono/best-effort: falha no matching nao
   * impede a criacao do pedido, apenas mantem o status `pending`).
   */
  async createOrder(customerId: string, dto: CreateOrderDto) {
    const [vehicle, address] = await Promise.all([
      this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } }),
      this.prisma.address.findUnique({ where: { id: dto.addressId } }),
    ]);

    if (!vehicle || vehicle.userId !== customerId) {
      throw new BadRequestException('Veiculo invalido para este cliente');
    }
    if (!address || address.userId !== customerId) {
      throw new BadRequestException('Endereco invalido para este cliente');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('O pedido precisa ter ao menos um item');
    }

    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.price * (item.quantity ?? 1),
      0,
    );

    const zoneId = await this.resolveZoneId(dto, address);

    const order = await this.prisma.order.create({
      data: {
        customerId,
        vehicleId: dto.vehicleId,
        addressId: dto.addressId,
        zoneId,
        serviceType: dto.serviceType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        notes: dto.notes,
        totalAmount,
        status: OrderStatus.pending,
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity ?? 1,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    // Servico pesado (HEAVY_SERVICE) e exclusivo do modulo `auctions` — o
    // pedido fica `pending` ate o cliente abrir um leilao (POST /auctions),
    // nunca passa pelo matching normal.
    if (order.serviceType === ServiceType.HEAVY_SERVICE) {
      return order;
    }

    return this.matchDriver(order.id);
  }

  async listMyOrders(customerId: string, query: ListOrdersDto) {
    const limit = query.limit ?? 20;

    const orders = await this.prisma.order.findMany({
      where: {
        customerId,
        ...(query.status ? { status: query.status } : {}),
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async getMyOrderById(customerId: string, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Este pedido nao pertence ao usuario autenticado');
    }

    return order;
  }

  async cancelOrder(customerId: string, orderId: string, dto: CancelOrderDto) {
    const order = await this.findOrderOrThrow(orderId);

    if (order.customerId !== customerId) {
      throw new ForbiddenException('Este pedido nao pertence ao usuario autenticado');
    }

    return this.transitionStatus(order, OrderStatus.cancelled, dto.reason);
  }

  // ────────────────────────────────────────────────────────────────────
  // LAVADOR
  // ────────────────────────────────────────────────────────────────────

  /** Lavador aceita um pedido que estava em busca de lavador (`searching_washer`). */
  async acceptOrder(driverUserId: string, orderId: string) {
    const order = await this.findOrderOrThrow(orderId);

    if (order.status !== OrderStatus.searching_washer) {
      throw new BadRequestException(
        `Pedido nao esta disponivel para aceite (status atual: ${order.status})`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { driverId: driverUserId, status: OrderStatus.accepted },
      include: ORDER_INCLUDE,
    });

    return updated;
  }

  async updateOrderStatusAsDriver(
    driverUserId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.findOrderOrThrow(orderId);

    if (order.driverId !== driverUserId) {
      throw new ForbiddenException('Este pedido nao esta atribuido a este lavador');
    }

    return this.transitionStatus(order, dto.status, dto.reason);
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────

  async listAllOrders(query: AdminListOrdersDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.OrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.search
        ? {
            OR: [
              { id: { equals: query.search } },
              { notes: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.startDate || query.endDate
        ? {
            createdAt: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderByIdAsAdmin(orderId: string) {
    return this.findOrderOrThrow(orderId);
  }

  async assignDriverAsAdmin(orderId: string, driverUserId: string) {
    const order = await this.findOrderOrThrow(orderId);

    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: driverUserId },
    });
    if (!driver) {
      throw new NotFoundException('Lavador nao encontrado');
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { driverId: driverUserId, status: OrderStatus.accepted },
      include: ORDER_INCLUDE,
    });
  }

  async updateOrderStatusAsAdmin(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOrderOrThrow(orderId);
    return this.transitionStatus(order, dto.status, dto.reason, true);
  }

  // ────────────────────────────────────────────────────────────────────
  // MATCHING LAVADOR x CLIENTE
  // ────────────────────────────────────────────────────────────────────

  /**
   * Busca o lavador disponivel para o pedido em tres etapas:
   *
   * 1. **Perfil** (`DriverProfile.driverType`): so considera MOTO_WASHER e
   *    CAR_WASHER — CARWASH_SHOP e exclusivo do leilao de servico pesado
   *    (modulo `auctions`), nunca participa do matching normal.
   * 2. **Zona** (`DriverProfile.currentZoneId`): se o pedido tem uma zona
   *    resolvida (`order.zoneId`), restringe a busca a lavadores ativos
   *    atualmente naquela zona — e a fonte de verdade mais confiavel no
   *    schema atual, pois nao ha rastreamento de geolocalizacao em tempo
   *    real do lavador.
   * 3. **Tipo + distancia**: para `DRY_WASH`/`EXPRESS_WASH`, MOTO_WASHER e
   *    priorizado sobre CAR_WASHER (PRD: "Moto ideal para Seco e
   *    Express") antes mesmo da distancia; sem `serviceType`, so
   *    distancia (haversine), dentro do raio de atendimento de cada um
   *    (`DriverProfile.serviceRadiusKm`).
   *
   * Move o pedido para `searching_washer` mesmo quando nenhum lavador e
   * encontrado de imediato, permitindo que um lavador aceite manualmente
   * mais tarde (endpoint `POST /orders/:id/accept`).
   */
  async matchDriver(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true },
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    if (order.serviceType === ServiceType.HEAVY_SERVICE) {
      return order;
    }

    const candidates = await this.prisma.driverProfile.findMany({
      where: {
        status: DriverStatus.active,
        driverType: { in: [DriverType.MOTO_WASHER, DriverType.CAR_WASHER] },
        ...(order.zoneId ? { currentZoneId: order.zoneId } : {}),
      },
      include: { user: { include: { addresses: true } } },
    });

    const bestDriverUserId = this.pickClosestDriver(order.address, candidates, order.serviceType);

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.searching_washer,
        ...(bestDriverUserId ? { driverId: bestDriverUserId } : {}),
      },
      include: ORDER_INCLUDE,
    });
  }

  /**
   * Escolhe o lavador mais adequado dentre os candidatos: preferencia de
   * tipo (quando aplicavel) vence distancia, respeitando o raio de
   * atendimento de cada um. Lavadores sem endereco cadastrado com
   * coordenadas sao considerados por ordem de chegada (fallback), ja que
   * nao ha como estimar distancia real para eles.
   */
  private pickClosestDriver(
    orderAddress: { latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null },
    candidates: Array<{
      userId: string;
      driverType: DriverType;
      serviceRadiusKm: Prisma.Decimal;
      user: { addresses: Array<{ latitude: Prisma.Decimal | null; longitude: Prisma.Decimal | null; isDefault: boolean }> };
    }>,
    serviceType: ServiceType | null,
  ): string | null {
    if (candidates.length === 0) return null;

    const orderLat = orderAddress.latitude ? Number(orderAddress.latitude) : null;
    const orderLng = orderAddress.longitude ? Number(orderAddress.longitude) : null;

    const ranked = candidates.map((driver) => {
      const address =
        driver.user.addresses.find((a) => a.isDefault) ?? driver.user.addresses[0];
      const radiusKm = Number(driver.serviceRadiusKm);

      if (orderLat === null || orderLng === null || !address?.latitude || !address?.longitude) {
        return { userId: driver.userId, driverType: driver.driverType, distanceKm: null, radiusKm };
      }

      const distanceKm = this.haversineKm(
        orderLat,
        orderLng,
        Number(address.latitude),
        Number(address.longitude),
      );

      return { userId: driver.userId, driverType: driver.driverType, distanceKm, radiusKm };
    });

    const withinRange = ranked
      .filter((entry) => entry.distanceKm === null || entry.distanceKm <= entry.radiusKm)
      .sort((a, b) => {
        const typeDelta = this.typePriority(a.driverType, serviceType) - this.typePriority(b.driverType, serviceType);
        if (typeDelta !== 0) return typeDelta;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

    return withinRange[0]?.userId ?? candidates[0].userId;
  }

  /**
   * Para DRY_WASH/EXPRESS_WASH, MOTO_WASHER e priorizado sobre CAR_WASHER
   * ("Moto ideal para Seco e Express", conforme docs/PRD.md) — a
   * preferencia de tipo vence a distancia. Sem servico especificado,
   * nenhuma preferencia (paridade com o comportamento anterior, so por
   * distancia).
   */
  private typePriority(driverType: DriverType, serviceType: ServiceType | null): number {
    const preferMoto = serviceType === ServiceType.DRY_WASH || serviceType === ServiceType.EXPRESS_WASH;
    if (!preferMoto) return 0;
    return driverType === DriverType.MOTO_WASHER ? 0 : 1;
  }

  /** Formula haversine padrao — distancia em km entre duas coordenadas. */
  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  private async resolveZoneId(
    dto: CreateOrderDto,
    address: { city: string; state: string; neighborhood: string },
  ): Promise<string | undefined> {
    if (dto.zoneId) return dto.zoneId;

    const zone = await this.prisma.zone.findFirst({
      where: {
        city: address.city,
        state: address.state,
        isActive: true,
        neighborhoods: { has: address.neighborhood },
      },
    });

    return zone?.id;
  }

  private async findOrderOrThrow(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: ORDER_INCLUDE,
    });

    if (!order) {
      throw new NotFoundException('Pedido nao encontrado');
    }

    return order;
  }

  private async transitionStatus(
    order: Order,
    newStatus: OrderStatus,
    reason?: string,
    isAdmin = false,
  ) {
    if (order.status === newStatus) {
      return order;
    }

    const allowed = isAdmin
      ? true
      : ALLOWED_TRANSITIONS[order.status].includes(newStatus);

    if (!allowed) {
      throw new BadRequestException(
        `Transicao de status invalida: ${order.status} -> ${newStatus}`,
      );
    }

    const timestamps: Prisma.OrderUpdateInput = {};
    if (newStatus === OrderStatus.in_progress) timestamps.startedAt = new Date();
    if (newStatus === OrderStatus.completed) timestamps.completedAt = new Date();

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        ...timestamps,
        notes: reason ? `${order.notes ? order.notes + '\n' : ''}${reason}` : order.notes,
      },
      include: ORDER_INCLUDE,
    });
  }
}
