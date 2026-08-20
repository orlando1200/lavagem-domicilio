import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWashPriceDto, UpdateWashPriceDto } from './dto/wash-pricing.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WashPricingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Matriz publica (autenticado) consumida pelo app do cliente ao criar um pedido. */
  listActive() {
    return this.prisma.washPriceMatrix.findMany({
      where: { active: true },
      orderBy: [{ carSize: 'asc' }, { washType: 'asc' }],
    });
  }

  listAll() {
    return this.prisma.washPriceMatrix.findMany({
      orderBy: [{ carSize: 'asc' }, { washType: 'asc' }],
    });
  }

  async create(dto: CreateWashPriceDto) {
    const existing = await this.prisma.washPriceMatrix.findUnique({
      where: { carSize_washType: { carSize: dto.carSize, washType: dto.washType } },
    });
    if (existing) {
      throw new ConflictException('Ja existe um preco cadastrado para esta combinacao de tamanho e tipo');
    }

    return this.prisma.washPriceMatrix.create({
      data: {
        carSize: dto.carSize,
        washType: dto.washType,
        price: dto.price,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateWashPriceDto) {
    await this.findOrThrow(id);

    return this.prisma.washPriceMatrix.update({
      where: { id },
      data: {
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    await this.prisma.washPriceMatrix.delete({ where: { id } });
    return { message: 'Preco removido.' };
  }

  private async findOrThrow(id: string) {
    const entry = await this.prisma.washPriceMatrix.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException('Combinacao de preco nao encontrada');
    }
    return entry;
  }
}
