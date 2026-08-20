import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVehicleDto } from './dto/vehicles.dto';

const CATALOG_YEAR_INCLUDE = {
  catalogYear: { include: { model: { include: { brand: true } } } },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

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
