import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVehicleDto } from './dto/vehicles.dto';
import { PLATE_LOOKUP_GATEWAY, PlateLookupGateway } from './plate-lookup/plate-lookup-gateway.interface';

const CATALOG_YEAR_INCLUDE = {
  catalogYear: { include: { model: { include: { brand: true } } } },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PLATE_LOOKUP_GATEWAY) private readonly plateLookupGateway: PlateLookupGateway,
  ) {}

  async lookupPlate(plate: string) {
    const result = await this.plateLookupGateway.lookup(plate);
    if (!result) {
      throw new NotFoundException('Placa nao encontrada na base consultada');
    }
    return result;
  }

  createVehicle(userId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        userId,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        color: dto.color,
        plate: dto.plate,
        catalogYearId: dto.catalogYearId,
        size: dto.size,
        renavam: dto.renavam,
      },
      include: CATALOG_YEAR_INCLUDE,
    });
  }

  listMyVehicles(userId: string) {
    return this.prisma.vehicle.findMany({
      where: { userId },
      include: CATALOG_YEAR_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
}
