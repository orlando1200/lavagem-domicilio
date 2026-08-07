import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LogisticsPlan, StoreType, UserRole } from '@prisma/client';
import { StoreService } from '../../../src/modules/store/store.service';
import { PrismaService } from '../../../src/database/prisma.service';

const OWNER_ID = 'owner-1';
const OTHER_USER_ID = 'other-1';
const STORE_ID = 'store-1';

const OWNER = { id: OWNER_ID, role: UserRole.LAVADOR };
const OTHER_USER = { id: OTHER_USER_ID, role: UserRole.LAVADOR };
const ADMIN = { id: 'admin-1', role: UserRole.ADMIN };

describe('StoreService', () => {
  let service: StoreService;
  let module: TestingModule;
  let prisma: {
    store: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
    product: { create: jest.Mock; findMany: jest.Mock };
    productOrder: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      store: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      product: { create: jest.fn(), findMany: jest.fn() },
      productOrder: { findMany: jest.fn() },
    };

    module = await Test.createTestingModule({
      providers: [StoreService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<StoreService>(StoreService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createStore', () => {
    it('throws ConflictException when the owner already has a store', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID });

      await expect(
        service.createStore(OWNER_ID, {
          name: 'Loja',
          document: '123',
          storeType: StoreType.CLIENTE,
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the store owned by the given userId, ignoring any client-supplied id', async () => {
      prisma.store.findUnique.mockResolvedValue(null);
      prisma.store.create.mockImplementation(({ data }) => Promise.resolve({ id: STORE_ID, ...data }));

      const result = await service.createStore(OWNER_ID, {
        name: 'Loja',
        document: '123',
        storeType: StoreType.CLIENTE,
        logisticsPlan: LogisticsPlan.INTEGRATED,
      } as any);

      expect(result.ownerUserId).toBe(OWNER_ID);
      expect(prisma.store.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ ownerUserId: OWNER_ID }) }),
      );
    });
  });

  describe('findStoreForOwner', () => {
    it('throws NotFoundException when the store does not exist', async () => {
      prisma.store.findUnique.mockResolvedValue(null);

      await expect(service.findStoreForOwner(STORE_ID, OWNER)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the requester is not the owner', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID, ownerUserId: OWNER_ID });

      await expect(service.findStoreForOwner(STORE_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows the owner', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID, ownerUserId: OWNER_ID });

      await expect(service.findStoreForOwner(STORE_ID, OWNER)).resolves.toEqual(
        expect.objectContaining({ id: STORE_ID }),
      );
    });

    it('allows an admin even when not the owner', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID, ownerUserId: OWNER_ID });

      await expect(service.findStoreForOwner(STORE_ID, ADMIN)).resolves.toEqual(
        expect.objectContaining({ id: STORE_ID }),
      );
    });
  });

  describe('createProduct / listProductsByStore / listOrdersByStore', () => {
    beforeEach(() => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID, ownerUserId: OWNER_ID });
    });

    it('createProduct throws ForbiddenException for a non-owner', async () => {
      await expect(
        service.createProduct(STORE_ID, OTHER_USER, { name: 'x', price: 10 } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('listProductsByStore throws ForbiddenException for a non-owner', async () => {
      await expect(service.listProductsByStore(STORE_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('listOrdersByStore throws ForbiddenException for a non-owner', async () => {
      await expect(service.listOrdersByStore(STORE_ID, OTHER_USER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.productOrder.findMany).not.toHaveBeenCalled();
    });

    it('listOrdersByStore returns the store orders for the owner', async () => {
      prisma.productOrder.findMany.mockResolvedValue([{ id: 'order-1', storeId: STORE_ID }]);

      const result = await service.listOrdersByStore(STORE_ID, OWNER);

      expect(prisma.productOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { storeId: STORE_ID } }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
