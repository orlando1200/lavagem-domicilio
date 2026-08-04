import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUpdateDriverProfileStatusDto,
  CreateDriverProfileDto,
  ListDriverProfilesQueryDto,
  UpdateDriverProfileAvailabilityDto,
  UpdateDriverProfileDto,
} from './dto/driver-profiles.dto';

const DRIVER_PROFILE_INCLUDE = {
  user: true,
  zone: true,
} satisfies Prisma.DriverProfileInclude;

@Injectable()
export class DriverProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // ONBOARDING / PERFIL DO MOTORISTA-LOJA (proprio usuario)
  // ────────────────────────────────────────────────────────────────────

  /**
   * Cria o perfil (`DriverProfile`) para o usuario autenticado. Requer
   * que o usuario tenha `role = LAVADOR` e ainda nao possua perfil.
   */
  async createProfile(userId: string, dto: CreateDriverProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    if (user.role !== UserRole.LAVADOR) {
      throw new BadRequestException(
        'Apenas usuarios com role LAVADOR podem criar perfil de motorista/loja',
      );
    }

    const existing = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Perfil de motorista/loja ja existe para este usuario');
    }

    if (dto.currentZoneId) {
      await this.ensureZoneExists(dto.currentZoneId);
    }

    return this.prisma.driverProfile.create({
      data: {
        userId,
        driverType: dto.driverType,
        allowedServices: dto.allowedServices ?? [],
        serviceRadiusKm: dto.serviceRadiusKm ?? 5,
        currentZoneId: dto.currentZoneId,
        status: DriverStatus.pending_documents,
      },
      include: DRIVER_PROFILE_INCLUDE,
    });
  }

  async getMyProfile(userId: string) {
    return this.findProfileOrThrow(userId);
  }

  async updateMyProfile(userId: string, dto: UpdateDriverProfileDto) {
    await this.findProfileOrThrow(userId);

    if (dto.currentZoneId) {
      await this.ensureZoneExists(dto.currentZoneId);
    }

    const data: Prisma.DriverProfileUpdateInput = {};
    if (dto.driverType !== undefined) data.driverType = dto.driverType;
    if (dto.allowedServices !== undefined) data.allowedServices = dto.allowedServices;
    if (dto.serviceRadiusKm !== undefined) data.serviceRadiusKm = dto.serviceRadiusKm;
    if (dto.currentZoneId !== undefined) {
      data.zone = { connect: { id: dto.currentZoneId } };
    }

    return this.prisma.driverProfile.update({
      where: { userId },
      data,
      include: DRIVER_PROFILE_INCLUDE,
    });
  }

  /**
   * Marca o proprio perfil como disponivel/indisponivel. So permite
   * alternar entre `active`/`inactive`; qualquer outra transicao
   * (documentos, bloqueio) e feita pelo admin.
   */
  async updateMyAvailability(userId: string, dto: UpdateDriverProfileAvailabilityDto) {
    const profile = await this.findProfileOrThrow(userId);

    if (profile.status !== DriverStatus.active && profile.status !== DriverStatus.inactive) {
      throw new BadRequestException(
        `Nao e possivel alterar disponibilidade com o status atual (${profile.status})`,
      );
    }
    if (dto.status !== DriverStatus.active && dto.status !== DriverStatus.inactive) {
      throw new BadRequestException(
        'Disponibilidade so pode ser definida como active ou inactive',
      );
    }

    return this.prisma.driverProfile.update({
      where: { userId },
      data: { status: dto.status },
      include: DRIVER_PROFILE_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN
  // ────────────────────────────────────────────────────────────────────

  async listProfiles(query: ListDriverProfilesQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.DriverProfileWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.driverType ? { driverType: query.driverType } : {}),
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
      this.prisma.driverProfile.findMany({
        where,
        include: DRIVER_PROFILE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.driverProfile.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProfileById(userId: string) {
    return this.findProfileOrThrow(userId);
  }

  async updateStatusAsAdmin(userId: string, dto: AdminUpdateDriverProfileStatusDto) {
    await this.findProfileOrThrow(userId);

    return this.prisma.driverProfile.update({
      where: { userId },
      data: { status: dto.status },
      include: DRIVER_PROFILE_INCLUDE,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findProfileOrThrow(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: DRIVER_PROFILE_INCLUDE,
    });

    if (!profile) {
      throw new NotFoundException('Perfil de motorista/loja nao encontrado');
    }

    return profile;
  }

  private async ensureZoneExists(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new BadRequestException('Zona informada nao existe');
    }
    return zone;
  }
}
