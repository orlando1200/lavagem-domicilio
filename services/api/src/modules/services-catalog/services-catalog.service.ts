  UpdateServiceVehicleRuleDto,
} from './dto/services-catalog.dto';

function mapFrontendSizeToBackend(size: string): string {
  const map: Record<string, string> = {
    small: 'pequeno',
    medium: 'medio',
    large: 'large',
    suv: 'suv',
    truck: 'pickup',
  };
  return map[size] || size;
}

@Injectable()
export class ServicesCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listCategoriesAdmin(page: number, limit: number) {
    return this.prisma.serviceCategory.findMany({
      include: {
        _count: { select: { services: true } },
      },
      orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async listServices(categoryId?: string) {
    return this.prisma.service.findMany({
      this.prisma.serviceCategory.findMany({
        where,
        include: {
          _count: { select: { services: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceCategory.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listServices(categoryId?: string) {
    });
  }

  async listServicesAdmin(categoryId?: string, page = 1, limit = 20) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          vehicleRules: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getCategory(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async deleteService(id: string) {
    await this.ensureServiceExists(id);
    return this.prisma.service.delete({ where: { id } });
  }

  async upsertVehicleRulePrice(serviceId: string, vehicleSizeTier: string, basePrice: number) {
    await this.ensureServiceExists(serviceId);

    const existing = await this.prisma.serviceVehicleRule.findFirst({
      where: { serviceId, vehicleSizeTier },
    });

    if (existing) {
      return this.prisma.serviceVehicleRule.update({
        where: { id: existing.id },
        data: { basePrice },
      });
    }

    return this.prisma.serviceVehicleRule.create({
      data: {
        serviceId,
        vehicleSizeTier,
        basePrice,
        priceMultiplier: 1,
        estimatedDurationMinutes: 30,
        isAvailable: true,
      },
    });
  }

  async createService(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        categoryId: dto.categoryId,
        isAvailable: true,
      },
    });
  }

  async createService(dto: CreateServiceDto) {
    return this.prisma.service.create({




    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCategory(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { services: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async deleteService(id: string) {
    await this.ensureServiceExists(id);











































    });
  }

  async createService(dto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        serviceMode: dto.serviceMode,
        estimatedDurationMinutes: dto.estimatedDurationMinutes,
        requiresSpecialEquipment: dto.requiresSpecialEquipment ?? false,
        requiresCertification: dto.requiresCertification ?? false,
        riskLevel: dto.riskLevel ?? 'low',
        isActive: dto.isActive ?? true,
      },
      include: {
        vehicleRules: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (dto.prices?.length) {
      await this.prisma.serviceVehicleRule.createMany({
        data: dto.prices.map((p) => ({
          serviceId: service.id,
          vehicleSizeTier: mapFrontendSizeToBackend(p.size) as any,
          basePrice: p.price,
          priceMultiplier: 1,
          estimatedDurationMinutes: dto.estimatedDurationMinutes,
          isAvailable: true,
        })),
      });
      return this.getService(service.id);
    }

    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    await this.ensureServiceExists(id);
          priceMultiplier: 1,
          estimatedDurationMinutes: dto.estimatedDurationMinutes ?? 60,
          isAvailable: true,
        })),
      });
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.serviceMode !== undefined ? { serviceMode: dto.serviceMode } : {}),
        ...(dto.estimatedDurationMinutes !== undefined
          ? { estimatedDurationMinutes: dto.estimatedDurationMinutes }
          : {}),
        ...(dto.requiresSpecialEquipment !== undefined
          ? { requiresSpecialEquipment: dto.requiresSpecialEquipment }
          : {}),
        ...(dto.requiresCertification !== undefined
          ? { requiresCertification: dto.requiresCertification }
          : {}),
        ...(dto.riskLevel !== undefined ? { riskLevel: dto.riskLevel } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        vehicleRules: true,
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async createVehicleRule(serviceId: string, dto: CreateServiceVehicleRuleDto) {
    await this.ensureServiceExists(serviceId);
