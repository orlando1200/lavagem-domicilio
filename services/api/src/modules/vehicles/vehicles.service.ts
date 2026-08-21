import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVehicleDto } from './dto/vehicles.dto';
import { PLATE_LOOKUP_GATEWAY, PlateLookupGateway } from './plate-lookup/plate-lookup-gateway.interface';
import { FISCAL_DEBT_GATEWAY, FiscalDebtGateway } from './fiscal-debts/fiscal-debt-gateway.interface';

const CATALOG_YEAR_INCLUDE = {
  catalogYear: { include: { model: { include: { brand: true } } } },
} satisfies Prisma.VehicleInclude;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PLATE_LOOKUP_GATEWAY) private readonly plateLookupGateway: PlateLookupGateway,
    @Inject(FISCAL_DEBT_GATEWAY) private readonly fiscalDebtGateway: FiscalDebtGateway,
  ) {}

  async lookupPlate(plate: string) {
    const result = await this.plateLookupGateway.lookup(plate);
    if (!result) {
      throw new NotFoundException('Placa nao encontrada na base consultada');
    }
    return result;
  }

  /**
   * Consulta debitos (IPVA/multas/licenciamento) pra placa do veiculo e
   * persiste um snapshot em VehicleFiscalDebt (upsert por
   * externalReference — uma nova consulta atualiza o valor sem duplicar
   * linha). So consulta: nenhum pagamento acontece aqui, `status` fica
   * `PENDING` ate um fluxo de pagamento de verdade existir (Fase 2).
   */
  async getFiscalDebts(userId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) {
      throw new NotFoundException('Veiculo nao encontrado');
    }

    const found = await this.fiscalDebtGateway.lookup(vehicle.plate);

    await Promise.all(
      found.map((debt) => {
        const dueDate = debt.dueDate ? new Date(debt.dueDate) : null;
        return this.prisma.vehicleFiscalDebt.upsert({
          where: { vehicleId_externalReference: { vehicleId, externalReference: debt.externalReference } },
          update: {
            description: debt.description,
            amount: debt.amount,
            dueDate,
            lastCheckedAt: new Date(),
          },
          create: {
            vehicleId,
            type: debt.type,
            externalReference: debt.externalReference,
            description: debt.description,
            amount: debt.amount,
            dueDate,
          },
        });
      }),
    );

    return this.prisma.vehicleFiscalDebt.findMany({
      where: { vehicleId, status: 'PENDING' },
      orderBy: { dueDate: 'asc' },
    });
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
