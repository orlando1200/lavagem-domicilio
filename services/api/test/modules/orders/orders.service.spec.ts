import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { DriverStatus, DriverType, OrderStatus, ServiceType } from '@prisma/client';
import { OrdersService } from '../../../src/modules/orders/orders.service';
import { PrismaService } from '../../../src/database/prisma.service';
import { MapsService } from '../../../src/modules/maps/maps.service';

const CUSTOMER_ID = 'customer-1';
const ORDER_ID = 'order-1';

// Sao Paulo (centro do pedido).
const ORDER_ADDRESS = { latitude: -23.5505 as any, longitude: -46.6333 as any };

function driverProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'driver-default',
    driverType: DriverType.CAR_WASHER,
    serviceRadiusKm: 20 as any,
    user: {
      addresses: [
        { latitude: ORDER_ADDRESS.latitude, longitude: ORDER_ADDRESS.longitude, isDefault: true },
      ],
    },
    ...overrides,
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let module: TestingModule;
  let prisma: {
    vehicle: { findUnique: jest.Mock };
    address: { findUnique: jest.Mock };
    zone: { findFirst: jest.Mock };
    order: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    driverProfile: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      vehicle: { findUnique: jest.fn() },
      address: { findUnique: jest.fn() },
      zone: { findFirst: jest.fn() },
      order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      driverProfile: { findMany: jest.fn(), findUnique: jest.fn() },
    };

    module = await Test.createTestingModule({
      providers: [
        OrdersService,
        MapsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(undefined) } },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createOrder', () => {
    beforeEach(() => {
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', userId: CUSTOMER_ID });
      prisma.address.findUnique.mockResolvedValue({
        id: 'address-1',
        userId: CUSTOMER_ID,
        city: 'Sao Paulo',
        state: 'SP',
        neighborhood: 'Centro',
      });
      prisma.zone.findFirst.mockResolvedValue(null);
    });

    it('skips matching for HEAVY_SERVICE orders (leilao-only)', async () => {
      prisma.order.create.mockResolvedValue({
        id: ORDER_ID,
        serviceType: ServiceType.HEAVY_SERVICE,
        status: OrderStatus.pending,
      });

      const result = await service.createOrder(CUSTOMER_ID, {
        vehicleId: 'vehicle-1',
        addressId: 'address-1',
        serviceType: ServiceType.HEAVY_SERVICE,
        items: [{ name: 'Polimento', price: 500 }],
      } as any);

      expect(result.status).toBe(OrderStatus.pending);
      expect(prisma.driverProfile.findMany).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('runs matching for DRY_WASH/EXPRESS_WASH/unspecified orders', async () => {
      prisma.order.create.mockResolvedValue({
        id: ORDER_ID,
        serviceType: ServiceType.DRY_WASH,
        status: OrderStatus.pending,
      });
      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        zoneId: null,
        serviceType: ServiceType.DRY_WASH,
        address: ORDER_ADDRESS,
      });
      prisma.driverProfile.findMany.mockResolvedValue([]);
      prisma.order.update.mockResolvedValue({ id: ORDER_ID, status: OrderStatus.searching_washer });

      await service.createOrder(CUSTOMER_ID, {
        vehicleId: 'vehicle-1',
        addressId: 'address-1',
        serviceType: ServiceType.DRY_WASH,
        items: [{ name: 'Lavagem a seco', price: 50 }],
      } as any);

      expect(prisma.driverProfile.findMany).toHaveBeenCalled();
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: OrderStatus.searching_washer }) }),
      );
    });
  });

  describe('matchDriver', () => {
    it('never includes CARWASH_SHOP in the candidate query', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        zoneId: null,
        serviceType: null,
        address: ORDER_ADDRESS,
      });
      prisma.driverProfile.findMany.mockResolvedValue([]);
      prisma.order.update.mockResolvedValue({ id: ORDER_ID });

      await service.matchDriver(ORDER_ID);

      const whereArg = prisma.driverProfile.findMany.mock.calls[0][0].where;
      expect(whereArg.status).toBe(DriverStatus.active);
      expect(whereArg.driverType.in).toEqual([DriverType.MOTO_WASHER, DriverType.CAR_WASHER]);
    });

    it('prioritizes MOTO_WASHER over a closer CAR_WASHER for DRY_WASH', async () => {
      const closeCarWasher = driverProfile({
        userId: 'car-washer-close',
        driverType: DriverType.CAR_WASHER,
        user: { addresses: [{ latitude: -23.5515, longitude: -46.6343, isDefault: true }] },
      });
      const farMotoWasher = driverProfile({
        userId: 'moto-washer-far',
        driverType: DriverType.MOTO_WASHER,
        user: { addresses: [{ latitude: -23.6, longitude: -46.65, isDefault: true }] },
      });

      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        zoneId: null,
        serviceType: ServiceType.DRY_WASH,
        address: ORDER_ADDRESS,
      });
      prisma.driverProfile.findMany.mockResolvedValue([closeCarWasher, farMotoWasher]);
      prisma.order.update.mockImplementation(({ data }) => Promise.resolve({ id: ORDER_ID, ...data }));

      const result = await service.matchDriver(ORDER_ID);

      expect(result.driverId).toBe('moto-washer-far');
    });

    it('falls back to pure distance when no serviceType is specified', async () => {
      const closeCarWasher = driverProfile({
        userId: 'car-washer-close',
        driverType: DriverType.CAR_WASHER,
        user: { addresses: [{ latitude: -23.5515, longitude: -46.6343, isDefault: true }] },
      });
      const farMotoWasher = driverProfile({
        userId: 'moto-washer-far',
        driverType: DriverType.MOTO_WASHER,
        user: { addresses: [{ latitude: -23.6, longitude: -46.65, isDefault: true }] },
      });

      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        zoneId: null,
        serviceType: null,
        address: ORDER_ADDRESS,
      });
      prisma.driverProfile.findMany.mockResolvedValue([closeCarWasher, farMotoWasher]);
      prisma.order.update.mockImplementation(({ data }) => Promise.resolve({ id: ORDER_ID, ...data }));

      const result = await service.matchDriver(ORDER_ID);

      expect(result.driverId).toBe('car-washer-close');
    });

    it('moves the order to searching_washer without a driverId when there are no candidates', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: ORDER_ID,
        zoneId: null,
        serviceType: null,
        address: ORDER_ADDRESS,
      });
      prisma.driverProfile.findMany.mockResolvedValue([]);
      prisma.order.update.mockImplementation(({ data }) => Promise.resolve({ id: ORDER_ID, ...data }));

      const result = await service.matchDriver(ORDER_ID);

      expect(result.status).toBe(OrderStatus.searching_washer);
      expect(result.driverId).toBeUndefined();
    });

    it('throws NotFoundException when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.matchDriver(ORDER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('assignDriverAsAdmin', () => {
    it('throws NotFoundException when the driver profile does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID });
      prisma.driverProfile.findUnique.mockResolvedValue(null);

      await expect(service.assignDriverAsAdmin(ORDER_ID, 'driver-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('assigns the driver and sets the order to accepted', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID });
      prisma.driverProfile.findUnique.mockResolvedValue({ userId: 'driver-1' });
      prisma.order.update.mockImplementation(({ data }) => Promise.resolve({ id: ORDER_ID, ...data }));

      const result = await service.assignDriverAsAdmin(ORDER_ID, 'driver-1');

      expect(result.driverId).toBe('driver-1');
      expect(result.status).toBe(OrderStatus.accepted);
    });
  });
});
