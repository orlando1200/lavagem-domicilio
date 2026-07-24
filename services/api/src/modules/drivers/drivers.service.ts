import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole, WasherStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUpdateWasherStatusDto,
  CreateWasherProfileDto,
  ListWashersQueryDto,
  UpdateWasherAvailabilityDto,
  UpdateWasherProfileDto,
} from './dto/washers.dto';

const WASHER_INCLUDE = {
  user: true,
  zone: true,
} satisfies Prisma.WasherInclude;

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // ONBOARDING / PERFIL DO LAVADOR (proprio usuario)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Cria o perfil de lavador (`Washer`) para o usuario autenticado.
   * Requer que o usuario tenha `role = LAVADOR` e ainda nao possua perfil.
   */
  async createProfile(userId: string, dto: CreateWasherProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    if (user.role !== UserRole.LAVADOR) {
      throw new BadRequestException(
        'Apenas usuarios com role LAVADOR podem criar perfil de lavador',
      );
    }

    const existing = await this.prisma.washer.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Perfil de lavador ja existe para este usuario');
    }

    if (dto.currentZoneId) {
      await this.ensureZoneExists(dto.currentZoneId);
    }

    return this.prisma.washer.create({
      data: {
        userId,
        serviceRadiusKm: dto.serviceRadiusKm ?? 5,
        currentZoneId: dto.currentZoneId,
        status: WasherStatus.pending_documents,
      },
      include: WASHER_INCLUDE,
    });
  }

  async getMyProfile(userId: string) {
    return this.findWasherOrThrow(userId);
  }

  async updateMyProfile(userId: string, dto: UpdateWasherProfileDto) {
    await this.findWasherOrThrow(userId);

    if (dto.currentZoneId) {
      await this.ensureZoneExists(dto.currentZoneId);
    }

    const data: Prisma.WasherUpdateInput = {};
    if (dto.serviceRadiusKm !== undefined) data.serviceRadiusKm = dto.serviceRadiusKm;
    if (dto.currentZoneId !== undefined) {
      data.zone = { connect: { id: dto.currentZoneId } };
    }

    return this.prisma.washer.update({
      where: { userId },
      data,
      include: WASHER_INCLUDE,
    });
  }

  /**
   * Marca o proprio lavador como disponivel/indisponivel para novos
   * pedidos. So permite alternar entre `active`/`inactive`; qualquer outra
   * transicao de status (documentos, bloqueio) e feita pelo admin.
   */
  async updateMyAvailability(userId: string, dto: UpdateWasherAvailabilityDto) {
    const washer = await this.findWasherOrThrow(userId);

    if (
      washer.status !== WasherStatus.active &&
      washer.status !== WasherStatus.inactive
    ) {
      throw new BadRequestException(
        `Nao e possivel alterar disponibilidade com o status atual (${washer.status})`,
      );
    }

    if (
      dto.status !== WasherStatus.active &&
      dto.status !== WasherStatus.inactive
    ) {
      throw new BadRequestException(
        'Disponibilidade so pode ser definida como active ou inactive',
      );
    }

    return this.prisma.washer.update({
      where: { userId },
      data: { status: dto.status },
      include: WASHER_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────

  async listWashers(query: ListWashersQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.WasherWhereInput = {
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
      this.prisma.washer.findMany({
        where,
        include: WASHER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.washer.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getWasherById(userId: string) {
    return this.findWasherOrThrow(userId);
  }

  async updateWasherStatusAsAdmin(userId: string, dto: AdminUpdateWasherStatusDto) {
    await this.findWasherOrThrow(userId);

    return this.prisma.washer.update({
      where: { userId },
      data: { status: dto.status },
      include: WASHER_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findWasherOrThrow(userId: string) {
    const washer = await this.prisma.washer.findUnique({
      where: { userId },
      include: WASHER_INCLUDE,
    });

    if (!washer) {
      throw new NotFoundException('Perfil de lavador nao encontrado');
    }

    return washer;
  }

  private async ensureZoneExists(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new BadRequestException('Zona informada nao existe');
    }
    return zone;
  }
}
