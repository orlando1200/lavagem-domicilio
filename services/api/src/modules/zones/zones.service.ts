import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateZoneDto, ListZonesQueryDto, UpdateZoneDto } from './dto/zones.dto';

const ZONE_INCLUDE = {
  _count: { select: { drivers: true, orders: true } },
} satisfies Prisma.ZoneInclude;

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async createZone(dto: CreateZoneDto) {
    const slugInUse = await this.prisma.zone.findUnique({ where: { slug: dto.slug } });
    if (slugInUse) {
      throw new ConflictException('Ja existe uma zona com este slug');
    }

    return this.prisma.zone.create({
      data: {
        city: dto.city,
        state: dto.state.toUpperCase(),
        name: dto.name,
        slug: dto.slug,
        neighborhoods: dto.neighborhoods ?? [],
        isActive: dto.isActive ?? true,
      },
      include: ZONE_INCLUDE,
    });
  }

  async listZones(query: ListZonesQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.ZoneWhereInput = {
      ...(query.state ? { state: query.state.toUpperCase() } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.zone.findMany({
        where,
        include: ZONE_INCLUDE,
        orderBy: [{ state: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.zone.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getZoneById(id: string) {
    return this.findZoneOrThrow(id);
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    await this.findZoneOrThrow(id);

    if (dto.slug) {
      const slugInUse = await this.prisma.zone.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (slugInUse) {
        throw new ConflictException('Ja existe uma zona com este slug');
      }
    }

    return this.prisma.zone.update({
      where: { id },
      data: {
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state.toUpperCase() } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.neighborhoods !== undefined ? { neighborhoods: dto.neighborhoods } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: ZONE_INCLUDE,
    });
  }

  async deactivateZone(id: string) {
    await this.findZoneOrThrow(id);
    // Soft-delete: Zone tem FK de DriverProfile.currentZoneId e
    // Order.zoneId — apagar de verdade quebraria historico.
    return this.prisma.zone.update({
      where: { id },
      data: { isActive: false },
      include: ZONE_INCLUDE,
    });
  }

  private async findZoneOrThrow(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id }, include: ZONE_INCLUDE });
    if (!zone) {
      throw new NotFoundException('Zona nao encontrada');
    }
    return zone;
  }
}
