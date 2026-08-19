import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuctionStatus,
  BidStatus,
  DriverStatus,
  DriverType,
  OrderStatus,
  Prisma,
  ServiceType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuctionsNotificationsService } from './auctions-notifications.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CreateBidDto, UpdateBidDto } from './dto/create-bid.dto';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import {
  AdminListAuctionsDto,
  ListAuctionsDto,
  ListAvailableAuctionsDto,
  ListMyBidsDto,
} from './dto/list-auctions.dto';

const AUCTION_DETAIL_INCLUDE = {
  order: {
    select: {
      id: true,
      customerId: true,
      status: true,
      totalAmount: true,
      scheduledAt: true,
      zoneId: true,
    },
  },
  bids: {
    include: {
      supplier: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.AuctionInclude;

const AUCTION_SUMMARY_INCLUDE = {
  order: { select: { id: true, status: true, totalAmount: true, scheduledAt: true } },
  _count: { select: { bids: true } },
} satisfies Prisma.AuctionInclude;

type AuctionDetail = Prisma.AuctionGetPayload<{ include: typeof AUCTION_DETAIL_INCLUDE }>;
type BidWithSupplier = AuctionDetail['bids'][number];

/**
 * Peso de cada criterio no ranking de pujas: preco (quanto menor, melhor),
 * prazo (quanto menor, melhor), garantia (quanto maior, melhor) e reputacao
 * da loja (media de avaliacoes). Somam 1.0.
 */
const RANKING_WEIGHTS = {
  amount: 0.4,
  duration: 0.2,
  warranty: 0.15,
  rating: 0.25,
};

@Injectable()
export class AuctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: AuctionsNotificationsService,
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // CLIENTE
  // ────────────────────────────────────────────────────────────────────

  /**
   * Abre um leilao para um pedido pendente do cliente autenticado.
   * Veiculo e endereco sao herdados do pedido (nunca aceitos do client)
   * para garantir consistencia com o `Order` original.
   */
  async createAuction(customerId: string, dto: CreateAuctionDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });

    if (!order || order.customerId !== customerId) {
      throw new NotFoundException('Pedido nao encontrado para este cliente');
    }
    if (order.status !== OrderStatus.pending) {
      throw new BadRequestException(
        `Leilao so pode ser aberto para pedidos pendentes (status atual: ${order.status})`,
      );
    }

    const existing = await this.prisma.auction.findUnique({ where: { orderId: order.id } });
    if (existing) {
      throw new ConflictException('Este pedido ja possui um leilao');
    }

    const auction = await this.prisma.auction.create({
      data: {
        orderId: order.id,
        serviceIds: dto.serviceIds,
        vehicleId: order.vehicleId,
        addressId: order.addressId,
        maxBudget: dto.maxBudget,
        deadlineHours: dto.deadlineHours,
        photos: dto.photos ?? [],
        description: dto.description,
        status: AuctionStatus.open,
      },
      include: AUCTION_DETAIL_INCLUDE,
    });

    this.notifications.notifyAuctionOpened(auction, order.zoneId);

    return auction;
  }

  async listMyAuctions(customerId: string, query: ListAuctionsDto) {
    const limit = query.limit ?? 20;

    const auctions = await this.prisma.auction.findMany({
      where: {
        order: { customerId },
        ...(query.status ? { status: query.status } : {}),
      },
      include: AUCTION_SUMMARY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = auctions.length > limit;
    const items = hasMore ? auctions.slice(0, limit) : auctions;

    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getMyAuction(customerId: string, auctionId: string) {
    const auction = await this.findAuctionOrThrow(auctionId);

    if (auction.order.customerId !== customerId) {
      throw new ForbiddenException('Este leilao nao pertence ao usuario autenticado');
    }

    const current = (await this.maybeExpireAuction(auction)) ?? auction;

    return { ...current, bids: this.rankBids(current.bids) };
  }

  async cancelMyAuction(customerId: string, auctionId: string, dto: CancelAuctionDto) {
    const auction = await this.findAuctionOrThrow(auctionId);

    if (auction.order.customerId !== customerId) {
      throw new ForbiddenException('Este leilao nao pertence ao usuario autenticado');
    }

    return this.cancelAuctionInternal(auction, dto.reason);
  }

  /**
   * Cliente aceita uma puja: fecha o leilao, rejeita as demais pujas e
   * atribui a loja vencedora (`DriverProfile`) como `driver` do pedido.
   */
  async acceptBid(customerId: string, auctionId: string, bidId: string) {
    const auction = await this.findAuctionOrThrow(auctionId);

    if (auction.order.customerId !== customerId) {
      throw new ForbiddenException('Este leilao nao pertence ao usuario autenticado');
    }
    if (auction.status !== AuctionStatus.open) {
      throw new BadRequestException(
        `Leilao nao esta aberto para selecao de vencedor (status atual: ${auction.status})`,
      );
    }

    const winningBid = auction.bids.find((bid) => bid.id === bidId);
    if (!winningBid) {
      throw new NotFoundException('Puja nao encontrada para este leilao');
    }
    if (winningBid.status !== BidStatus.pending) {
      throw new BadRequestException('Esta puja ja foi processada');
    }

    const otherBidIds = auction.bids.filter((bid) => bid.id !== bidId).map((bid) => bid.id);

    await this.prisma.$transaction([
      this.prisma.auctionBid.update({
        where: { id: bidId },
        data: { status: BidStatus.accepted },
      }),
      ...(otherBidIds.length
        ? [
            this.prisma.auctionBid.updateMany({
              where: { id: { in: otherBidIds } },
              data: { status: BidStatus.rejected },
            }),
          ]
        : []),
      this.prisma.auction.update({
        where: { id: auction.id },
        data: { status: AuctionStatus.closed, closedAt: new Date(), winningBidId: bidId },
      }),
      this.prisma.order.update({
        where: { id: auction.order.id },
        data: { driverId: winningBid.supplier.userId, status: OrderStatus.accepted },
      }),
    ]);

    const updated = await this.findAuctionOrThrow(auction.id);
    const acceptedBid = updated.bids.find((bid) => bid.id === bidId)!;

    this.notifications.notifyBidAccepted(acceptedBid);
    updated.bids
      .filter((bid) => bid.id !== bidId)
      .forEach((bid) => this.notifications.notifyBidRejected(bid));

    return { ...updated, bids: this.rankBids(updated.bids) };
  }

  // ────────────────────────────────────────────────────────────────────
  // LOJA / OFICINA (LAVADOR com DriverProfile CARWASH_SHOP)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Leiloes abertos disponiveis para a loja autenticada pujar. Restringe
   * pela zona atual da loja quando ela tiver uma definida; sem zona,
   * mostra todos os leiloes abertos.
   */
  async listAvailableAuctions(supplierUserId: string, query: ListAvailableAuctionsDto) {
    const supplier = await this.findEligibleSupplierProfile(supplierUserId);
    const limit = query.limit ?? 20;

    const auctions = await this.prisma.auction.findMany({
      where: {
        status: AuctionStatus.open,
        ...(supplier.currentZoneId ? { order: { zoneId: supplier.currentZoneId } } : {}),
      },
      include: AUCTION_SUMMARY_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = auctions.length > limit;
    const items = hasMore ? auctions.slice(0, limit) : auctions;

    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async createBid(supplierUserId: string, auctionId: string, dto: CreateBidDto) {
    const supplier = await this.findEligibleSupplierProfile(supplierUserId);
    const auction = await this.findAuctionOrThrow(auctionId);

    const expired = await this.maybeExpireAuction(auction);
    if (expired || auction.status !== AuctionStatus.open) {
      throw new BadRequestException(
        `Leilao nao esta aberto para pujas (status atual: ${expired?.status ?? auction.status})`,
      );
    }

    const existingBid = await this.prisma.auctionBid.findFirst({
      where: { auctionId, supplierId: supplier.id, status: BidStatus.pending },
    });
    if (existingBid) {
      throw new ConflictException(
        'Voce ja possui uma puja pendente neste leilao. Atualize-a em vez de criar outra.',
      );
    }

    const bid = await this.prisma.auctionBid.create({
      data: {
        auctionId,
        supplierId: supplier.id,
        amount: dto.amount,
        durationHours: dto.durationHours,
        warrantyDays: dto.warrantyDays,
        message: dto.message,
        photos: dto.photos ?? [],
        status: BidStatus.pending,
      },
    });

    this.notifications.notifyNewBid(auction, bid);

    return bid;
  }

  async updateMyBid(supplierUserId: string, auctionId: string, dto: UpdateBidDto) {
    const supplier = await this.findEligibleSupplierProfile(supplierUserId);
    const bid = await this.findOwnPendingBidOrThrow(auctionId, supplier.id);

    return this.prisma.auctionBid.update({
      where: { id: bid.id },
      data: {
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.durationHours !== undefined ? { durationHours: dto.durationHours } : {}),
        ...(dto.warrantyDays !== undefined ? { warrantyDays: dto.warrantyDays } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
        ...(dto.photos !== undefined ? { photos: dto.photos } : {}),
      },
    });
  }

  async withdrawMyBid(supplierUserId: string, auctionId: string) {
    const supplier = await this.findEligibleSupplierProfile(supplierUserId);
    const bid = await this.findOwnPendingBidOrThrow(auctionId, supplier.id);

    await this.prisma.auctionBid.delete({ where: { id: bid.id } });

    return { success: true };
  }

  async listMyBids(supplierUserId: string, query: ListMyBidsDto) {
    const supplier = await this.findEligibleSupplierProfile(supplierUserId);
    const limit = query.limit ?? 20;

    const bids = await this.prisma.auctionBid.findMany({
      where: { supplierId: supplier.id },
      include: { auction: { include: { order: { select: { id: true, status: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = bids.length > limit;
    const items = hasMore ? bids.slice(0, limit) : bids;

    return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────

  async listAllAuctionsAsAdmin(query: AdminListAuctionsDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.AuctionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { id: { equals: query.search } },
              { orderId: { equals: query.search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        include: AUCTION_SUMMARY_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auction.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAuctionByIdAsAdmin(auctionId: string) {
    const auction = await this.findAuctionOrThrow(auctionId);
    return { ...auction, bids: this.rankBids(auction.bids) };
  }

  async cancelAuctionAsAdmin(auctionId: string, dto: CancelAuctionDto) {
    const auction = await this.findAuctionOrThrow(auctionId);
    return this.cancelAuctionInternal(auction, dto.reason);
  }

  /**
   * Varre leiloes abertos com prazo vencido e os marca como `expired`.
   * Nao ha scheduler no processo Nest hoje — este endpoint existe para
   * ser chamado por um cron externo (ex.: EventBridge/cron do servidor).
   */
  async expireOverdueAuctions() {
    const candidates = await this.prisma.auction.findMany({
      where: { status: AuctionStatus.open, deadlineHours: { not: null } },
    });

    const now = Date.now();
    const overdue = candidates.filter((auction) => {
      const deadline =
        auction.createdAt.getTime() + (auction.deadlineHours ?? 0) * 60 * 60 * 1000;
      return deadline <= now;
    });

    if (overdue.length === 0) {
      return { expiredCount: 0 };
    }

    await this.prisma.auction.updateMany({
      where: { id: { in: overdue.map((auction) => auction.id) } },
      data: { status: AuctionStatus.expired, closedAt: new Date() },
    });

    overdue.forEach((auction) => this.notifications.notifyAuctionExpired(auction));

    return { expiredCount: overdue.length };
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findAuctionOrThrow(auctionId: string): Promise<AuctionDetail> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: AUCTION_DETAIL_INCLUDE,
    });

    if (!auction) {
      throw new NotFoundException('Leilao nao encontrado');
    }

    return auction;
  }

  private async findEligibleSupplierProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new NotFoundException(
        'Perfil de loja/oficina (DriverProfile) nao encontrado para este usuario',
      );
    }
    if (profile.driverType !== DriverType.CARWASH_SHOP) {
      throw new ForbiddenException('Apenas lojas/oficinas (CARWASH_SHOP) podem participar de leiloes');
    }
    if (!profile.allowedServices.includes(ServiceType.HEAVY_SERVICE)) {
      throw new ForbiddenException('Perfil nao esta habilitado para servicos pesados');
    }
    if (profile.status !== DriverStatus.active) {
      throw new BadRequestException(
        `Perfil precisa estar ativo para enviar pujas (status atual: ${profile.status})`,
      );
    }

    return profile;
  }

  private async findOwnPendingBidOrThrow(auctionId: string, supplierId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) {
      throw new NotFoundException('Leilao nao encontrado');
    }
    if (auction.status !== AuctionStatus.open) {
      throw new BadRequestException(
        `Nao e possivel alterar pujas de um leilao com status ${auction.status}`,
      );
    }

    const bid = await this.prisma.auctionBid.findFirst({
      where: { auctionId, supplierId, status: BidStatus.pending },
    });
    if (!bid) {
      throw new NotFoundException('Nenhuma puja pendente encontrada para este leilao');
    }

    return bid;
  }

  private async cancelAuctionInternal(auction: AuctionDetail, reason?: string) {
    if (auction.status !== AuctionStatus.open) {
      throw new BadRequestException(
        `Leilao nao pode ser cancelado (status atual: ${auction.status})`,
      );
    }

    const cancelled = await this.prisma.auction.update({
      where: { id: auction.id },
      data: { status: AuctionStatus.cancelled, closedAt: new Date() },
      include: AUCTION_DETAIL_INCLUDE,
    });

    if (reason) {
      const order = await this.prisma.order.findUnique({
        where: { id: auction.order.id },
        select: { notes: true },
      });
      await this.prisma.order.update({
        where: { id: auction.order.id },
        data: { notes: order?.notes ? `${order.notes}\n${reason}` : reason },
      });
    }

    this.notifications.notifyAuctionCancelled(cancelled);

    return cancelled;
  }

  /**
   * Se o leilao estiver aberto e o prazo (`deadlineHours`) ja tiver
   * vencido, marca como `expired` e retorna a versao atualizada; caso
   * contrario retorna `null` (nada mudou).
   */
  private async maybeExpireAuction(auction: AuctionDetail): Promise<AuctionDetail | null> {
    if (auction.status !== AuctionStatus.open || !auction.deadlineHours) {
      return null;
    }

    const deadline = auction.createdAt.getTime() + auction.deadlineHours * 60 * 60 * 1000;
    if (deadline > Date.now()) {
      return null;
    }

    const expired = await this.prisma.auction.update({
      where: { id: auction.id },
      data: { status: AuctionStatus.expired, closedAt: new Date() },
      include: AUCTION_DETAIL_INCLUDE,
    });

    this.notifications.notifyAuctionExpired(expired);

    return expired;
  }

  /**
   * Ranking de pujas por score ponderado: preco e prazo pesam a favor do
   * menor valor, garantia e reputacao da loja pesam a favor do maior
   * valor (ver `RANKING_WEIGHTS`). Score normalizado 0–1 entre as pujas
   * do proprio leilao.
   */
  private rankBids<T extends BidWithSupplier>(bids: T[]): Array<T & { score: number; rank: number }> {
    if (bids.length === 0) {
      return [];
    }

    const amounts = bids.map((bid) => Number(bid.amount));
    const durations = bids.map((bid) => bid.durationHours);
    const warranties = bids.map((bid) => bid.warrantyDays);

    const normalize = (value: number, values: number[], invert: boolean) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (max === min) return 0.5;
      const ratio = (value - min) / (max - min);
      return invert ? 1 - ratio : ratio;
    };

    const scored = bids.map((bid) => {
      const rating = bid.supplier.averageRating ? Number(bid.supplier.averageRating) : 0;
      const score =
        normalize(Number(bid.amount), amounts, true) * RANKING_WEIGHTS.amount +
        normalize(bid.durationHours, durations, true) * RANKING_WEIGHTS.duration +
        normalize(bid.warrantyDays, warranties, false) * RANKING_WEIGHTS.warranty +
        (rating / 5) * RANKING_WEIGHTS.rating;

      return { ...bid, score: Number(score.toFixed(4)) };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((bid, index) => ({ ...bid, rank: index + 1 }));
  }
}
