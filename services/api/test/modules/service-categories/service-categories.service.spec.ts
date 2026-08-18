import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { ServiceCategoriesService } from '../../../src/modules/service-categories/service-categories.service';
import { PrismaService } from '../../../src/database/prisma.service';

const CATEGORY_ID = 'category-1';

function category(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: CATEGORY_ID,
    serviceType: ServiceType.DRY_WASH,
    name: 'Lavagem a Seco',
    description: null,
    price: 59.9,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ServiceCategoriesService', () => {
  let service: ServiceCategoriesService;
  let module: TestingModule;
  let prisma: {
    serviceCategory: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      serviceCategory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [ServiceCategoriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ServiceCategoriesService);
  });

  afterEach(() => module.close());

  it('listActive filtra apenas categorias ativas', async () => {
    prisma.serviceCategory.findMany.mockResolvedValue([category()]);

    await service.listActive();

    expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
  });

  it('create lanca ConflictException quando ja existe categoria para o serviceType', async () => {
    prisma.serviceCategory.findUnique.mockResolvedValue(category());

    await expect(
      service.create({ serviceType: ServiceType.DRY_WASH, name: 'X', price: 10 } as any),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.serviceCategory.create).not.toHaveBeenCalled();
  });

  it('create grava a categoria quando o serviceType ainda nao existe', async () => {
    prisma.serviceCategory.findUnique.mockResolvedValue(null);
    prisma.serviceCategory.create.mockResolvedValue(category());

    await service.create({
      serviceType: ServiceType.EXPRESS_WASH,
      name: 'Lavagem Express',
      price: 89.9,
    } as any);

    expect(prisma.serviceCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ serviceType: ServiceType.EXPRESS_WASH, active: true }),
      }),
    );
  });

  it('update lanca NotFoundException quando a categoria nao existe', async () => {
    prisma.serviceCategory.findUnique.mockResolvedValue(null);

    await expect(service.update(CATEGORY_ID, { price: 99 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update so altera os campos informados', async () => {
    prisma.serviceCategory.findUnique.mockResolvedValue(category());
    prisma.serviceCategory.update.mockResolvedValue(category({ price: 79.9 }));

    await service.update(CATEGORY_ID, { price: 79.9 } as any);

    expect(prisma.serviceCategory.update).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
      data: { price: 79.9 },
    });
  });

  it('remove deleta a categoria quando ela existe', async () => {
    prisma.serviceCategory.findUnique.mockResolvedValue(category());

    const result = await service.remove(CATEGORY_ID);

    expect(prisma.serviceCategory.delete).toHaveBeenCalledWith({ where: { id: CATEGORY_ID } });
    expect(result.message).toBeTruthy();
  });
});
