import { Injectable, NotFoundException } from '@nestjs/common';
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
        ...(rental.status === RentalStatus.requested
          ? { status: RentalStatus.active, startedAt: new Date() }
          : {}),
      },
      include: RENTAL_INCLUDE,
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
