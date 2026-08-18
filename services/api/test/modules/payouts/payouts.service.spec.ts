import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PayoutStatus, ProductOrderStatus } from '@prisma/client';
import { PayoutsService } from '../../../src/modules/payouts/payouts.service';
import { PrismaService } from '../../../src/database/prisma.service';

const WASHER_ID = 'washer-1';
const STORE_ID = 'store-1';
const PAYOUT_ID = 'payout-1';

describe('PayoutsService', () => {
  let service: PayoutsService;
  let module: TestingModule;
  let prisma: {
    driverProfile: { findUnique: jest.Mock };
    store: { findUnique: jest.Mock };
    order: { findMany: jest.Mock };
    productOrder: { findMany: jest.Mock };
    payout: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock; count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      driverProfile: { findUnique: jest.fn() },
      store: { findUnique: jest.fn() },
      order: { findMany: jest.fn() },
      productOrder: { findMany: jest.fn() },
      payout: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [PayoutsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('generateWasherPayout', () => {
    it('throws NotFoundException when the driver does not exist', async () => {
      prisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.generateWasherPayout({
          washerId: WASHER_ID,
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when periodStart is not before periodEnd', async () => {
      prisma.driverProfile.findUnique.mockResolvedValue({ userId: WASHER_ID });

      await expect(
        service.generateWasherPayout({
          washerId: WASHER_ID,
          periodStart: '2026-02-01',
          periodEnd: '2026-01-01',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it('sums completed orders in the period and applies the commission rate', async () => {
      prisma.driverProfile.findUnique.mockResolvedValue({ userId: WASHER_ID });
      prisma.order.findMany.mockResolvedValue([
        { totalAmount: 100 },
        { totalAmount: 50 },
      ]);
      prisma.payout.create.mockImplementation(({ data }) => Promise.resolve({ id: PAYOUT_ID, ...data }));

      const result = await service.generateWasherPayout({
        washerId: WASHER_ID,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        commissionRate: 10,
      } as any);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: WASHER_ID, status: OrderStatus.completed }),
        }),
      );
      expect(result.grossAmount).toBe(150);
      expect(result.commissionAmount).toBe(15);
      expect(result.netAmount).toBe(135);
      expect(result.ordersCount).toBe(2);
    });
  });

  describe('generateStorePayout', () => {
    it('throws NotFoundException when the store does not exist', async () => {
      prisma.store.findUnique.mockResolvedValue(null);

      await expect(
        service.generateStorePayout({
          storeId: STORE_ID,
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when periodStart is not before periodEnd', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID });

      await expect(
        service.generateStorePayout({
          storeId: STORE_ID,
          periodStart: '2026-01-31',
          periodEnd: '2026-01-01',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sums delivered product orders using their already-computed commissionAmount', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID });
      prisma.productOrder.findMany.mockResolvedValue([
        { totalAmount: 80, commissionAmount: 8 },
        { totalAmount: 20, commissionAmount: 2 },
      ]);
      prisma.payout.create.mockImplementation(({ data }) => Promise.resolve({ id: PAYOUT_ID, ...data }));

      const result = await service.generateStorePayout({
        storeId: STORE_ID,
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      } as any);

      expect(prisma.productOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: STORE_ID, status: ProductOrderStatus.delivered }),
        }),
      );
      expect(result.grossAmount).toBe(100);
      expect(result.commissionAmount).toBe(10);
      expect(result.netAmount).toBe(90);
    });
  });

  describe('updatePayoutStatus', () => {
    it('throws NotFoundException when the payout does not exist', async () => {
      prisma.payout.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePayoutStatus(PAYOUT_ID, { status: PayoutStatus.approved } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the payout is already paid', async () => {
      prisma.payout.findUnique.mockResolvedValue({ id: PAYOUT_ID, status: PayoutStatus.paid });

      await expect(
        service.updatePayoutStatus(PAYOUT_ID, { status: PayoutStatus.approved } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when rejecting without a rejectionReason', async () => {
      prisma.payout.findUnique.mockResolvedValue({ id: PAYOUT_ID, status: PayoutStatus.pending });

      await expect(
        service.updatePayoutStatus(PAYOUT_ID, { status: PayoutStatus.rejected } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets approvedAt when approving', async () => {
      prisma.payout.findUnique.mockResolvedValue({ id: PAYOUT_ID, status: PayoutStatus.pending });
      prisma.payout.update.mockResolvedValue({ id: PAYOUT_ID });

      await service.updatePayoutStatus(PAYOUT_ID, { status: PayoutStatus.approved } as any);

      expect(prisma.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PayoutStatus.approved, approvedAt: expect.any(Date) }),
        }),
      );
    });

    it('sets paidAt when paying', async () => {
      prisma.payout.findUnique.mockResolvedValue({ id: PAYOUT_ID, status: PayoutStatus.approved });
      prisma.payout.update.mockResolvedValue({ id: PAYOUT_ID });

      await service.updatePayoutStatus(PAYOUT_ID, { status: PayoutStatus.paid } as any);

      expect(prisma.payout.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: PayoutStatus.paid, paidAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('listMyStorePayouts', () => {
    it('throws NotFoundException when the owner has no store', async () => {
      prisma.store.findUnique.mockResolvedValue(null);

      await expect(service.listMyStorePayouts('owner-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the payouts for the owner store', async () => {
      prisma.store.findUnique.mockResolvedValue({ id: STORE_ID });
      prisma.payout.findMany.mockResolvedValue([{ id: PAYOUT_ID }]);

      const result = await service.listMyStorePayouts('owner-1');

      expect(prisma.payout.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { recipientStoreId: STORE_ID } }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
