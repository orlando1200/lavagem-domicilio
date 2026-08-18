import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductOrderDeliveryStatus, ProductOrderStatus } from '@prisma/client';
import { DeliveriesService } from '../../../src/modules/deliveries/deliveries.service';
import { PrismaService } from '../../../src/database/prisma.service';

const DRIVER_ID = 'driver-1';
const OTHER_DRIVER_ID = 'driver-2';
const DELIVERY_ID = 'delivery-1';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let module: TestingModule;
  let prisma: {
    productOrder: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      productOrder: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [DeliveriesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('acceptDelivery', () => {
    it('throws NotFoundException when the delivery does not exist', async () => {
      prisma.productOrder.findUnique.mockResolvedValue(null);

      await expect(service.acceptDelivery(DRIVER_ID, DELIVERY_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the delivery is not PENDING', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.ACCEPTED,
        deliveryDriverId: null,
      });

      await expect(service.acceptDelivery(DRIVER_ID, DELIVERY_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the delivery already has a driver', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.PENDING,
        deliveryDriverId: OTHER_DRIVER_ID,
      });

      await expect(service.acceptDelivery(DRIVER_ID, DELIVERY_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws BadRequestException when the driver already has an active delivery', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.PENDING,
        deliveryDriverId: null,
      });
      prisma.productOrder.findFirst.mockResolvedValue({ id: 'active-delivery' });

      await expect(service.acceptDelivery(DRIVER_ID, DELIVERY_ID)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.productOrder.update).not.toHaveBeenCalled();
    });

    it('assigns the driver and sets ACCEPTED + assignedAt on success', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.PENDING,
        deliveryDriverId: null,
      });
      prisma.productOrder.findFirst.mockResolvedValue(null);
      prisma.productOrder.update.mockResolvedValue({ id: DELIVERY_ID });

      await service.acceptDelivery(DRIVER_ID, DELIVERY_ID);

      expect(prisma.productOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DELIVERY_ID },
          data: expect.objectContaining({
            deliveryDriverId: DRIVER_ID,
            deliveryStatus: ProductOrderDeliveryStatus.ACCEPTED,
            assignedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('updateDeliveryStatus', () => {
    it('throws ForbiddenException when the delivery is not assigned to this driver', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.ACCEPTED,
        deliveryDriverId: OTHER_DRIVER_ID,
      });

      await expect(
        service.updateDeliveryStatus(DRIVER_ID, DELIVERY_ID, {
          status: ProductOrderDeliveryStatus.ON_THE_WAY,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    const allowedTransitions: Array<
      [ProductOrderDeliveryStatus, ProductOrderDeliveryStatus]
    > = [
      [ProductOrderDeliveryStatus.PENDING, ProductOrderDeliveryStatus.ACCEPTED],
      [ProductOrderDeliveryStatus.PENDING, ProductOrderDeliveryStatus.CANCELLED],
      [ProductOrderDeliveryStatus.ACCEPTED, ProductOrderDeliveryStatus.ON_THE_WAY],
      [ProductOrderDeliveryStatus.ACCEPTED, ProductOrderDeliveryStatus.CANCELLED],
      [ProductOrderDeliveryStatus.ON_THE_WAY, ProductOrderDeliveryStatus.DELIVERED],
      [ProductOrderDeliveryStatus.ON_THE_WAY, ProductOrderDeliveryStatus.CANCELLED],
    ];

    it.each(allowedTransitions)('allows transition %s -> %s', async (from, to) => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: from,
        deliveryDriverId: DRIVER_ID,
      });
      prisma.productOrder.update.mockResolvedValue({ id: DELIVERY_ID, deliveryStatus: to });

      await service.updateDeliveryStatus(DRIVER_ID, DELIVERY_ID, { status: to });

      expect(prisma.productOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DELIVERY_ID },
          data: expect.objectContaining({ deliveryStatus: to }),
        }),
      );
    });

    const disallowedTransitions: Array<
      [ProductOrderDeliveryStatus, ProductOrderDeliveryStatus]
    > = [
      [ProductOrderDeliveryStatus.PENDING, ProductOrderDeliveryStatus.ON_THE_WAY],
      [ProductOrderDeliveryStatus.PENDING, ProductOrderDeliveryStatus.DELIVERED],
      [ProductOrderDeliveryStatus.ACCEPTED, ProductOrderDeliveryStatus.DELIVERED],
      [ProductOrderDeliveryStatus.DELIVERED, ProductOrderDeliveryStatus.ACCEPTED],
      [ProductOrderDeliveryStatus.CANCELLED, ProductOrderDeliveryStatus.ACCEPTED],
    ];

    it.each(disallowedTransitions)('rejects transition %s -> %s', async (from, to) => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: from,
        deliveryDriverId: DRIVER_ID,
      });

      await expect(
        service.updateDeliveryStatus(DRIVER_ID, DELIVERY_ID, { status: to }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.productOrder.update).not.toHaveBeenCalled();
    });

    it('sets the commercial status to delivered + deliveredAt when transitioning to DELIVERED', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.ON_THE_WAY,
        deliveryDriverId: DRIVER_ID,
      });
      prisma.productOrder.update.mockResolvedValue({ id: DELIVERY_ID });

      await service.updateDeliveryStatus(DRIVER_ID, DELIVERY_ID, {
        status: ProductOrderDeliveryStatus.DELIVERED,
      });

      expect(prisma.productOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryStatus: ProductOrderDeliveryStatus.DELIVERED,
            deliveredAt: expect.any(Date),
            status: ProductOrderStatus.delivered,
          }),
        }),
      );
    });

    it('is a no-op that re-fetches when the status is unchanged', async () => {
      const current = {
        id: DELIVERY_ID,
        deliveryStatus: ProductOrderDeliveryStatus.ACCEPTED,
        deliveryDriverId: DRIVER_ID,
      };
      prisma.productOrder.findUnique.mockResolvedValue(current);

      await service.updateDeliveryStatus(DRIVER_ID, DELIVERY_ID, {
        status: ProductOrderDeliveryStatus.ACCEPTED,
      });

      expect(prisma.productOrder.update).not.toHaveBeenCalled();
      expect(prisma.productOrder.findUnique).toHaveBeenCalledTimes(2);
    });
  });
});
