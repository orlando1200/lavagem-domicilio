import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StarterKitStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateStarterKitDto,
  ListStarterKitsQueryDto,
  UpdateStarterKitStatusDto,
} from './dto/starter-kit.dto';

const STARTER_KIT_INCLUDE = {
  washer: {
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  },
} satisfies Prisma.StarterKitInclude;

@Injectable()
export class StarterKitService {
  constructor(private readonly prisma: PrismaService) {}

  async createStarterKit(dto: CreateStarterKitDto) {
    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { userId: dto.washerId },
    });
    if (!driverProfile) {
      throw new NotFoundException('Perfil de motorista/loja nao encontrado');
    }

    const existing = await this.prisma.starterKit.findUnique({
      where: { washerId: dto.washerId },
    });
    if (existing) {
      throw new ConflictException('Kit inicial ja existe para este lavador');
    }

    return this.prisma.starterKit.create({
      data: {
        washerId: dto.washerId,
        price: dto.price,
        installments: dto.installments ?? 1,
      },
      include: STARTER_KIT_INCLUDE,
    });
  }

  async listStarterKits(query: ListStarterKitsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.StarterKitWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            washer: {
              user: {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.starterKit.findMany({
        where,
        include: STARTER_KIT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.starterKit.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStarterKitByWasherId(washerId: string) {
    return this.findStarterKitOrThrow(washerId);
  }

  async updateStatusAsAdmin(washerId: string, dto: UpdateStarterKitStatusDto) {
    const kit = await this.findStarterKitOrThrow(washerId);

    return this.prisma.starterKit.update({
      where: { washerId },
      data: {
        status: dto.status,
        ...(dto.status === StarterKitStatus.paid && !kit.paidAt ? { paidAt: new Date() } : {}),
      },
      include: STARTER_KIT_INCLUDE,
    });
  }

  private async findStarterKitOrThrow(washerId: string) {
    const kit = await this.prisma.starterKit.findUnique({
      where: { washerId },
      include: STARTER_KIT_INCLUDE,
    });
    if (!kit) {
      throw new NotFoundException('Kit inicial nao encontrado');
    }
    return kit;
  }
}
