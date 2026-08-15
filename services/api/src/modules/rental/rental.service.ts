import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignRentalDriverDto,
  CreateRentalDto,
  ListRentalsQueryDto,
  UpdateRentalStatusDto,
} from './dto/rental.dto';

const RENTAL_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  driver: { include: { user: { select: { id: true, name: true, email: true } } } },
} satisfies Prisma.RentalInclude;

@Injectable()
export class RentalService {
  constructor(private readonly prisma: PrismaService) {}

  async createRental(dto: CreateRentalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return this.prisma.rental.create({
      data: {
        userId: dto.userId,
        weeklyRate: dto.weeklyRate,
        status: RentalStatus.requested,
      },
      include: RENTAL_INCLUDE,
    });
  }

  async listRentals(query: ListRentalsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.RentalWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            user: {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        include: RENTAL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rental.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRentalById(id: string) {
    return this.findRentalOrThrow(id);
  }

  async assignDriverAsAdmin(id: string, dto: AssignRentalDriverDto) {
    const rental = await this.findRentalOrThrow(id);

    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: dto.driverId },
    });
    if (!driver) {
      throw new NotFoundException('Lavador nao encontrado');
    }

    return this.prisma.rental.update({
      where: { id },
      data: {
        driverId: dto.driverId,
        ...(dto.weeklyRate !== undefined ? { weeklyRate: dto.weeklyRate } : {}),
        ...(rental.status === RentalStatus.requested
          ? { status: RentalStatus.active, startedAt: new Date() }
          : {}),
      },
      include: RENTAL_INCLUDE,
    });
  }

  /**
   * Autoservico do lavador: solicita um aluguel de moto sem definir o
   * valor (nao existe tabela de planos/precos no schema — o admin
   * confirma o weeklyRate real ao atribuir um veiculo/lavador via
   * `assignDriverAsAdmin`). Um lavador so pode ter uma solicitacao
   * ativa por vez.
   */
  async requestRental(userId: string) {
    const existing = await this.prisma.rental.findFirst({
      where: { userId, status: { in: [RentalStatus.requested, RentalStatus.active] } },
    });
    if (existing) {
      throw new ConflictException(
        'Voce ja tem uma locacao de moto em andamento (solicitada ou ativa)',
      );
    }

    return this.prisma.rental.create({
      data: {
        userId,
        weeklyRate: 0,
        status: RentalStatus.requested,
      },
      include: RENTAL_INCLUDE,
    });
  }

  /**
   * Retorna a locacao mais relevante do lavador: prioriza uma em
   * andamento (requested/active) e cai para a mais recente (encerrada
   * ou cancelada) quando nao ha nenhuma em andamento. `null` quando o
   * lavador nunca solicitou nenhuma.
   */
  async getMyRental(userId: string) {
    const ongoing = await this.prisma.rental.findFirst({
      where: { userId, status: { in: [RentalStatus.requested, RentalStatus.active] } },
      include: RENTAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    if (ongoing) return ongoing;

    return this.prisma.rental.findFirst({
      where: { userId },
      include: RENTAL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatusAsAdmin(id: string, dto: UpdateRentalStatusDto) {
    const rental = await this.findRentalOrThrow(id);

    const timestamps: Prisma.RentalUpdateInput = {};
    if (dto.status === RentalStatus.active && !rental.startedAt) {
      timestamps.startedAt = new Date();
    }
    if (
      (dto.status === RentalStatus.completed || dto.status === RentalStatus.cancelled) &&
      !rental.endedAt
    ) {
      timestamps.endedAt = new Date();
    }

    return this.prisma.rental.update({
      where: { id },
      data: { status: dto.status, ...timestamps },
      include: RENTAL_INCLUDE,
    });
  }

  private async findRentalOrThrow(id: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
      include: RENTAL_INCLUDE,
    });
    if (!rental) {
      throw new NotFoundException('Locacao nao encontrada');
    }
    return rental;
  }
}
