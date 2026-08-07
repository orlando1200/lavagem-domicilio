import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, ProductOrderStatus } from '@prisma/client';
import { PaymentsService } from '../../../src/modules/payments/payments.service';
import { PrismaService } from '../../../src/database/prisma.service';
import { LoyaltyService } from '../../../src/modules/loyalty/loyalty.service';
import { PAYMENT_GATEWAY_ADAPTER } from '../../../src/modules/payments/adapters/payment-gateway.interface';

const ORDER_ID = 'order-1';
const PRODUCT_ORDER_ID = 'product-order-1';
const CUSTOMER_ID = 'customer-1';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let module: TestingModule;
  let prisma: {
    order: { findUnique: jest.Mock };
    productOrder: { findUnique: jest.Mock; update: jest.Mock };
    payment: { findUnique: jest.Mock; findFirst: jest.Mock; create: jest.Mock; update: jest.Mock };
  };
  let loyaltyService: { grantForPaidOrder: jest.Mock };
  let gateway: { createIntent: jest.Mock };

  beforeEach(async () => {
    prisma = {
      order: { findUnique: jest.fn() },
      productOrder: { findUnique: jest.fn(), update: jest.fn() },
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    loyaltyService = { grantForPaidOrder: jest.fn() };
    gateway = { createIntent: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: LoyaltyService, useValue: loyaltyService },
        { provide: PAYMENT_GATEWAY_ADAPTER, useValue: gateway },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createIntent', () => {
    it('throws NotFoundException when the order does not belong to the user', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: 'someone-else' });

      await expect(
        service.createIntent(CUSTOMER_ID, { orderId: ORDER_ID, method: PaymentMethod.pix }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException when the order already has a payment', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID, totalAmount: 100 });
      prisma.payment.findUnique.mockResolvedValue({ id: 'existing-payment' });

      await expect(
        service.createIntent(CUSTOMER_ID, { orderId: ORDER_ID, method: PaymentMethod.pix }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('delegates to the gateway adapter and persists a pending payment', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: ORDER_ID, customerId: CUSTOMER_ID, totalAmount: 100 });
      prisma.payment.findUnique.mockResolvedValue(null);
      gateway.createIntent.mockResolvedValue({
        externalRef: 'order_order-1',
        status: 'pending',
        method: PaymentMethod.pix,
        qrCode: 'mock-qr',
      });
      prisma.payment.create.mockImplementation(({ data }) => Promise.resolve({ id: 'payment-1', ...data }));

      const result = await service.createIntent(CUSTOMER_ID, {
        orderId: ORDER_ID,
        method: PaymentMethod.pix,
      });

      expect(gateway.createIntent).toHaveBeenCalledWith({
        amount: 100,
        method: PaymentMethod.pix,
        externalRef: 'order_order-1',
      });
      expect(result.payment.status).toBe(PaymentStatus.pending);
      expect(result.gateway.qrCode).toBe('mock-qr');
    });

    it('throws BadRequestException when neither orderId nor productOrderId is given', async () => {
      await expect(
        service.createIntent(CUSTOMER_ID, { method: PaymentMethod.pix }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when both orderId and productOrderId are given', async () => {
      await expect(
        service.createIntent(CUSTOMER_ID, {
          orderId: ORDER_ID,
          productOrderId: PRODUCT_ORDER_ID,
          method: PaymentMethod.pix,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates an intent for a productOrder when productOrderId is given', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: PRODUCT_ORDER_ID,
        buyerUserId: CUSTOMER_ID,
        totalAmount: 80,
      });
      prisma.payment.findUnique.mockResolvedValue(null);
      gateway.createIntent.mockResolvedValue({
        externalRef: 'product_order_product-order-1',
        status: 'pending',
        method: PaymentMethod.pix,
        qrCode: 'mock-qr',
      });
      prisma.payment.create.mockImplementation(({ data }) => Promise.resolve({ id: 'payment-2', ...data }));

      const result = await service.createIntent(CUSTOMER_ID, {
        productOrderId: PRODUCT_ORDER_ID,
        method: PaymentMethod.pix,
      });

      expect(gateway.createIntent).toHaveBeenCalledWith({
        amount: 80,
        method: PaymentMethod.pix,
        externalRef: 'product_order_product-order-1',
      });
      expect(result.payment.productOrderId).toBe(PRODUCT_ORDER_ID);
    });

    it('throws NotFoundException when the productOrder does not belong to the user', async () => {
      prisma.productOrder.findUnique.mockResolvedValue({
        id: PRODUCT_ORDER_ID,
        buyerUserId: 'someone-else',
        totalAmount: 80,
      });

      await expect(
        service.createIntent(CUSTOMER_ID, { productOrderId: PRODUCT_ORDER_ID, method: PaymentMethod.pix }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('handleWebhook', () => {
    it('throws NotFoundException when no payment matches the external ref', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.handleWebhook({ externalRef: 'unknown', status: 'approved' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('marks the payment as paid and grants loyalty points on first approval', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        orderId: ORDER_ID,
        status: PaymentStatus.pending,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.paid });

      await service.handleWebhook({ externalRef: 'order_order-1', status: 'approved' });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: PaymentStatus.paid },
      });
      expect(loyaltyService.grantForPaidOrder).toHaveBeenCalledWith(ORDER_ID);
    });

    it('does not grant points again when the payment was already paid', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        orderId: ORDER_ID,
        status: PaymentStatus.paid,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.paid });

      await service.handleWebhook({ externalRef: 'order_order-1', status: 'approved' });

      expect(loyaltyService.grantForPaidOrder).not.toHaveBeenCalled();
    });

    it('does not throw when the loyalty grant fails (best-effort)', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        orderId: ORDER_ID,
        status: PaymentStatus.pending,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.paid });
      loyaltyService.grantForPaidOrder.mockRejectedValue(new ConflictException('ja concedido'));

      await expect(
        service.handleWebhook({ externalRef: 'order_order-1', status: 'approved' }),
      ).resolves.toEqual({ id: 'payment-1', status: PaymentStatus.paid });
    });

    it('marks the payment as failed on rejection, without granting points', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        orderId: ORDER_ID,
        status: PaymentStatus.pending,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.failed });

      await service.handleWebhook({ externalRef: 'order_order-1', status: 'rejected' });

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: PaymentStatus.failed },
      });
      expect(loyaltyService.grantForPaidOrder).not.toHaveBeenCalled();
    });

    it('confirms the productOrder payment status on first approval, without granting loyalty points', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-2',
        orderId: null,
        productOrderId: PRODUCT_ORDER_ID,
        status: PaymentStatus.pending,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-2', status: PaymentStatus.paid });
      prisma.productOrder.update.mockResolvedValue({ id: PRODUCT_ORDER_ID });

      await service.handleWebhook({ externalRef: 'product_order_product-order-1', status: 'approved' });

      expect(prisma.productOrder.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ORDER_ID },
        data: { paymentStatus: PaymentStatus.paid, status: ProductOrderStatus.confirmed },
      });
      expect(loyaltyService.grantForPaidOrder).not.toHaveBeenCalled();
    });

    it('does not throw when confirming the productOrder fails (best-effort)', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-2',
        orderId: null,
        productOrderId: PRODUCT_ORDER_ID,
        status: PaymentStatus.pending,
      });
      prisma.payment.update.mockResolvedValue({ id: 'payment-2', status: PaymentStatus.paid });
      prisma.productOrder.update.mockRejectedValue(new Error('db down'));

      await expect(
        service.handleWebhook({ externalRef: 'product_order_product-order-1', status: 'approved' }),
      ).resolves.toEqual({ id: 'payment-2', status: PaymentStatus.paid });
    });
  });
});
