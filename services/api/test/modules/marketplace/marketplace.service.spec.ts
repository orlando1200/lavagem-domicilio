import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, StoreStatus } from '@prisma/client';
import { MarketplaceService } from '../../../src/modules/marketplace/marketplace.service';
import { PrismaService } from '../../../src/database/prisma.service';

const BUYER_ID = 'buyer-1';

function product(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'product-1',
    storeId: 'store-1',
    name: 'Aromatizante',
    price: new Prisma.Decimal(50),
    stockQuantity: 10,
    status: ProductStatus.active,
    store: {
      id: 'store-1',
      status: StoreStatus.active,
      commissionPlan: { takeRate: new Prisma.Decimal(0.18) },
    },
    ...overrides,
  };
}

const SHIPPING_ADDRESS = {
  street: 'Rua A',
  number: '100',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  zipCode: '01000-000',
};

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let module: TestingModule;
  let prisma: {
    product: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    product: { updateMany: jest.Mock };
    productOrder: { create: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      productOrder: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'order-1', ...data })),
      },
    };
    prisma = {
      product: { findMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback(tx)),
    };

    module = await Test.createTestingModule({
      providers: [MarketplaceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('checkout', () => {
    it('throws BadRequestException for duplicate products in the cart', async () => {
      await expect(
        service.checkout(BUYER_ID, {
          items: [
            { productId: 'product-1', quantity: 1 },
            { productId: 'product-1', quantity: 2 },
          ],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFoundException when a product does not exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'missing', quantity: 1 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the product is not active', async () => {
      prisma.product.findMany.mockResolvedValue([product({ status: ProductStatus.pending_approval })]);

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when the store is not active', async () => {
      prisma.product.findMany.mockResolvedValue([
        product({ store: { id: 'store-1', status: StoreStatus.pending, commissionPlan: { takeRate: new Prisma.Decimal(0.18) } } }),
      ]);

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when stock is insufficient', async () => {
      prisma.product.findMany.mockResolvedValue([product({ stockQuantity: 1 })]);

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'product-1', quantity: 5 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when the store has no commission plan', async () => {
      prisma.product.findMany.mockResolvedValue([
        product({ store: { id: 'store-1', status: StoreStatus.active, commissionPlan: null } }),
      ]);

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'product-1', quantity: 1 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when stock changed during the transaction', async () => {
      prisma.product.findMany.mockResolvedValue([product({ stockQuantity: 10 })]);
      tx.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.checkout(BUYER_ID, {
          items: [{ productId: 'product-1', quantity: 2 }],
          shippingAddress: SHIPPING_ADDRESS,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('computes subtotal, shipping and commission for a single-store cart below the free-shipping threshold', async () => {
      prisma.product.findMany.mockResolvedValue([product({ price: new Prisma.Decimal(50), stockQuantity: 10 })]);

      const result = await service.checkout(BUYER_ID, {
        items: [{ productId: 'product-1', quantity: 2 }],
        shippingAddress: SHIPPING_ADDRESS,
      });

      expect(result.orders).toHaveLength(1);
      const [order] = result.orders as any[];
      expect(Number(order.subtotal)).toBe(100);
      expect(Number(order.shippingAmount)).toBe(14.9);
      expect(Number(order.commissionAmount)).toBeCloseTo(18, 2);
      expect(Number(order.totalAmount)).toBeCloseTo(114.9, 2);
      expect(order.shippingAddress).toEqual(SHIPPING_ADDRESS);
    });

    it('waives shipping at or above the free-shipping threshold', async () => {
      prisma.product.findMany.mockResolvedValue([product({ price: new Prisma.Decimal(200), stockQuantity: 10 })]);

      const result = await service.checkout(BUYER_ID, {
        items: [{ productId: 'product-1', quantity: 1 }],
        shippingAddress: SHIPPING_ADDRESS,
      });

      expect(Number((result.orders[0] as any).shippingAmount)).toBe(0);
    });

    it('splits a multi-store cart into one ProductOrder per store', async () => {
      const productA = product({ id: 'product-a', storeId: 'store-a', store: { id: 'store-a', status: StoreStatus.active, commissionPlan: { takeRate: new Prisma.Decimal(0.1) } } });
      const productB = product({ id: 'product-b', storeId: 'store-b', store: { id: 'store-b', status: StoreStatus.active, commissionPlan: { takeRate: new Prisma.Decimal(0.2) } } });
      prisma.product.findMany.mockResolvedValue([productA, productB]);

      const result = await service.checkout(BUYER_ID, {
        items: [
          { productId: 'product-a', quantity: 1 },
          { productId: 'product-b', quantity: 1 },
        ],
        shippingAddress: SHIPPING_ADDRESS,
      });

      expect(result.orders).toHaveLength(2);
      expect(tx.productOrder.create).toHaveBeenCalledTimes(2);
    });
  });
});
