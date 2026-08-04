import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { LoyaltyService } from '../../../src/modules/loyalty/loyalty.service';
import { PrismaService } from '../../../src/database/prisma.service';

const ORDER_ID = 'order-1';
const CUSTOMER_ID = 'customer-1';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let prisma: {
    order: { findUnique: jest.Mock };
    loyaltyPoint: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    loyaltyRedemption: { findUnique: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: jest.fn() },
      loyaltyPoint: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      loyaltyRedemption: { findUnique: jest.fn(), create: jest.fn() },
      $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  describe('grantForPaidOrder', () => {
    it('throws NotFoundException when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.grantForPaidOrder(ORDER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws ConflictException when the order was already granted points', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID, totalAmount: 100 });
      prisma.loyaltyPoint.findFirst.mockResolvedValue({ id: 'existing-grant' });

      await expect(service.grantForPaidOrder(ORDER_ID)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('grants 5 points per real (5% of the order, at 1 point = R$0.01)', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID, totalAmount: 100 });
      prisma.loyaltyPoint.findFirst.mockResolvedValue(null);
      prisma.loyaltyPoint.create.mockImplementation(({ data }) => Promise.resolve(data));

      const result = await service.grantForPaidOrder(ORDER_ID);

      expect(result.amount).toBe(500);
      expect(result.userId).toBe(CUSTOMER_ID);
      expect(result.orderId).toBe(ORDER_ID);
    });

    it('throws BadRequestException when the computed grant rounds to zero', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID, totalAmount: 0.01 });
      prisma.loyaltyPoint.findFirst.mockResolvedValue(null);

      await expect(service.grantForPaidOrder(ORDER_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getBalance', () => {
    it('sums amount minus redeemedAmount across non-expired grants', async () => {
      prisma.loyaltyPoint.findMany.mockResolvedValue([
        { id: 'g1', amount: 100, redeemedAmount: 40, expiresAt: daysFromNow(10) },
        { id: 'g2', amount: 50, redeemedAmount: 0, expiresAt: daysFromNow(5) },
      ]);

      const result = await service.getBalance(CUSTOMER_ID);

      expect(result.balance).toBe(110);
      expect(result.balanceValue).toBeCloseTo(1.1, 2);
      expect(result.nextExpiration?.amount).toBe(50);
    });

    it('returns zero balance and no next expiration with no active grants', async () => {
      prisma.loyaltyPoint.findMany.mockResolvedValue([]);

      const result = await service.getBalance(CUSTOMER_ID);

      expect(result.balance).toBe(0);
      expect(result.nextExpiration).toBeNull();
    });
  });

  describe('redeemPoints', () => {
    it('throws NotFoundException when the order does not belong to the user', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: 'someone-else' });

      await expect(
        service.redeemPoints(CUSTOMER_ID, { orderId: ORDER_ID, amount: 10 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the order already had a redemption', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID });
      prisma.loyaltyRedemption.findUnique.mockResolvedValue({ id: 'existing-redemption' });

      await expect(
        service.redeemPoints(CUSTOMER_ID, { orderId: ORDER_ID, amount: 10 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws BadRequestException when the requested amount exceeds the balance', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID });
      prisma.loyaltyRedemption.findUnique.mockResolvedValue(null);
      prisma.loyaltyPoint.findMany.mockResolvedValue([
        { id: 'g1', amount: 10, redeemedAmount: 0, expiresAt: daysFromNow(10) },
      ]);

      await expect(
        service.redeemPoints(CUSTOMER_ID, { orderId: ORDER_ID, amount: 20 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('consumes the soonest-expiring grants first, partially draining one if needed', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID });
      prisma.loyaltyRedemption.findUnique.mockResolvedValue(null);
      prisma.loyaltyPoint.findMany.mockResolvedValue([
        { id: 'soon', amount: 30, redeemedAmount: 0, expiresAt: daysFromNow(5) },
        { id: 'later', amount: 100, redeemedAmount: 0, expiresAt: daysFromNow(50) },
      ]);
      prisma.loyaltyPoint.update.mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      );
      prisma.loyaltyRedemption.create.mockImplementation(({ data }) => Promise.resolve(data));

      const result = await service.redeemPoints(CUSTOMER_ID, { orderId: ORDER_ID, amount: 50 });

      expect(prisma.loyaltyPoint.update).toHaveBeenCalledTimes(2);
      expect(prisma.loyaltyPoint.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'soon' },
        data: { redeemedAmount: 30, usedAt: expect.any(Date) },
      });
      expect(prisma.loyaltyPoint.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'later' },
        data: { redeemedAmount: 20 },
      });
      expect(result.discountValue).toBeCloseTo(0.5, 2);
    });
  });

  describe('expireOverduePoints', () => {
    it('marks overdue, unused grants as used and reports the count', async () => {
      prisma.loyaltyPoint.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.expireOverduePoints();

      expect(result.expiredCount).toBe(3);
      expect(prisma.loyaltyPoint.updateMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) }, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });
});
