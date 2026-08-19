import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateVehicleBrandDto,
  CreateVehicleCatalogModelDto,
  CreateVehicleCatalogYearDto,
  UpdateVehicleBrandDto,
  UpdateVehicleCatalogModelDto,
  UpdateVehicleCatalogYearDto,
} from './dto/vehicle-catalog.dto';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class VehicleCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ────────────────────────────────────────────────────────────────────
  // CONSULTA PUBLICA (cascata marca -> modelo -> ano)
  // ────────────────────────────────────────────────────────────────────

  listActiveBrands() {
    return this.prisma.vehicleBrand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  listActiveModels(brandId?: string) {
    return this.prisma.vehicleCatalogModel.findMany({
      where: { active: true, ...(brandId ? { brandId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  listActiveYears(modelId?: string) {
    return this.prisma.vehicleCatalogYear.findMany({
      where: { active: true, ...(modelId ? { modelId } : {}) },
      orderBy: { year: 'desc' },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN — MARCAS
  // ────────────────────────────────────────────────────────────────────

  listAllBrands() {
    return this.prisma.vehicleBrand.findMany({ orderBy: { name: 'asc' } });
  }

  async createBrand(dto: CreateVehicleBrandDto) {
    const existing = await this.prisma.vehicleBrand.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Ja existe uma marca com este nome');
    }

    return this.prisma.vehicleBrand.create({
      data: { name: dto.name, slug: slugify(dto.name), active: dto.active ?? true },
    });
  }

  async updateBrand(id: string, dto: UpdateVehicleBrandDto) {
    await this.findBrandOrThrow(id);

    return this.prisma.vehicleBrand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name, slug: slugify(dto.name) } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async removeBrand(id: string) {
    await this.findBrandOrThrow(id);

    const [modelsCount, fitmentsCount] = await Promise.all([
      this.prisma.vehicleCatalogModel.count({ where: { brandId: id } }),
      this.prisma.productFitment.count({ where: { brandId: id } }),
    ]);
    if (modelsCount > 0 || fitmentsCount > 0) {
      throw new ConflictException('Marca em uso — remova os modelos/compatibilidades vinculados antes');
    }

    await this.prisma.vehicleBrand.delete({ where: { id } });
    return { message: 'Marca removida.' };
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN — MODELOS
  // ────────────────────────────────────────────────────────────────────

  listAllModels(brandId?: string) {
    return this.prisma.vehicleCatalogModel.findMany({
      where: brandId ? { brandId } : {},
      orderBy: { name: 'asc' },
    });
  }

  async createModel(dto: CreateVehicleCatalogModelDto) {
    await this.findBrandOrThrow(dto.brandId);

    const existing = await this.prisma.vehicleCatalogModel.findUnique({
      where: { brandId_name: { brandId: dto.brandId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException('Ja existe um modelo com este nome para esta marca');
    }

    return this.prisma.vehicleCatalogModel.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        vehicleType: dto.vehicleType,
        active: dto.active ?? true,
      },
    });
  }

  async updateModel(id: string, dto: UpdateVehicleCatalogModelDto) {
    await this.findModelOrThrow(id);

    return this.prisma.vehicleCatalogModel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.vehicleType !== undefined ? { vehicleType: dto.vehicleType } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async removeModel(id: string) {
    await this.findModelOrThrow(id);

    const [yearsCount, fitmentsCount] = await Promise.all([
      this.prisma.vehicleCatalogYear.count({ where: { modelId: id } }),
      this.prisma.productFitment.count({ where: { modelId: id } }),
    ]);
    if (yearsCount > 0 || fitmentsCount > 0) {
      throw new ConflictException('Modelo em uso — remova os anos/compatibilidades vinculados antes');
    }

    await this.prisma.vehicleCatalogModel.delete({ where: { id } });
    return { message: 'Modelo removido.' };
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN — ANOS
  // ────────────────────────────────────────────────────────────────────

  listAllYears(modelId?: string) {
    return this.prisma.vehicleCatalogYear.findMany({
      where: modelId ? { modelId } : {},
      orderBy: { year: 'desc' },
    });
  }

  async createYear(dto: CreateVehicleCatalogYearDto) {
    await this.findModelOrThrow(dto.modelId);

    const existing = await this.prisma.vehicleCatalogYear.findUnique({
      where: { modelId_year: { modelId: dto.modelId, year: dto.year } },
    });
    if (existing) {
      throw new ConflictException('Este ano ja esta cadastrado para este modelo');
    }

    return this.prisma.vehicleCatalogYear.create({
      data: { modelId: dto.modelId, year: dto.year, active: dto.active ?? true },
    });
  }

  async updateYear(id: string, dto: UpdateVehicleCatalogYearDto) {
    await this.findYearOrThrow(id);

    return this.prisma.vehicleCatalogYear.update({
      where: { id },
      data: {
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async removeYear(id: string) {
    await this.findYearOrThrow(id);

    const vehiclesCount = await this.prisma.vehicle.count({ where: { catalogYearId: id } });
    if (vehiclesCount > 0) {
      throw new ConflictException('Ano em uso por veiculos cadastrados — nao pode ser removido');
    }

    await this.prisma.vehicleCatalogYear.delete({ where: { id } });
    return { message: 'Ano removido.' };
  }

  // ────────────────────────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────────────────────────

  private async findBrandOrThrow(id: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Marca nao encontrada');
    }
    return brand;
  }

  private async findModelOrThrow(id: string) {
    const model = await this.prisma.vehicleCatalogModel.findUnique({ where: { id } });
    if (!model) {
      throw new NotFoundException('Modelo nao encontrado');
    }
    return model;
  }

  private async findYearOrThrow(id: string) {
    const year = await this.prisma.vehicleCatalogYear.findUnique({ where: { id } });
    if (!year) {
      throw new NotFoundException('Ano nao encontrado');
    }
    return year;
  }
}
