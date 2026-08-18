import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from './dto/service-categories.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catalogo publico (autenticado) consumido pelo app do cliente ao criar um pedido. */
  listActive() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listAll() {
    return this.prisma.serviceCategory.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateServiceCategoryDto) {
    const existing = await this.prisma.serviceCategory.findUnique({
      where: { serviceType: dto.serviceType },
    });
    if (existing) {
      throw new ConflictException('Ja existe uma categoria para este tipo de servico');
    }

    return this.prisma.serviceCategory.create({
      data: {
        serviceType: dto.serviceType,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    await this.findOrThrow(id);

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    await this.prisma.serviceCategory.delete({ where: { id } });
    return { message: 'Categoria removida.' };
  }

  private async findOrThrow(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria de servico nao encontrada');
    }
    return category;
  }
}
