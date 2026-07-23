export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async listZones(query: ListZonesQueryDto) {
    const where: any = {
      ...(query.includeInactive ? {} : { isActive: true }),
      ...(query.state ? { state: query.state.toUpperCase() } : {}),
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.coverageZone.findMany({
        where,
        include: { pricingRules: true },
        orderBy: [{ state: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.coverageZone.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getZone(id: string) {
    const zone = await this.prisma.coverageZone.findUnique({
      totalPages: Math.ceil(total / limit),
    };
  }

  async getZone(id: string) {
    const zone = await this.prisma.coverageZone.findUnique({
  async getZonePricingRules(zoneId: string) {
    const zone = await this.prisma.coverageZone.findUnique({
      where: { id: zoneId },
    });

























      throw new ConflictException('Zone with this slug already exists');
    }

    return this.prisma.coverageZone.create({
      data: {
        city: dto.city,
        state: dto.state.toUpperCase(),
        name: dto.name,
        slug: dto.slug,
        surgeEnabled: dto.surgeEnabled ?? false,
        isActive: dto.isActive ?? true,
        neighborhoods: dto.neighborhoods ?? [],
      },
      include: { pricingRules: true },
    });
  }

  async updateZone(id: string, dto: UpdateZoneDto) {
    await this.ensureZoneExists(id);







      }
    }

    return this.prisma.coverageZone.update({
      where: { id },
      data: {
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state.toUpperCase() } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.surgeEnabled !== undefined ? { surgeEnabled: dto.surgeEnabled } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.neighborhoods !== undefined ? { neighborhoods: dto.neighborhoods } : {}),
      },
      include: { pricingRules: true },
    });
  }

  async deleteZone(id: string) {
    await this.ensureZoneExists(id);
