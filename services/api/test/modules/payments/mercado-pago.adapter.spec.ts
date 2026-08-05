import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@prisma/client';
import { MercadoPagoAdapter } from '../../../src/modules/payments/adapters/mercado-pago.adapter';

describe('MercadoPagoAdapter', () => {
  let config: { get: jest.Mock };
  let modules: TestingModule[];

  async function buildAdapter(): Promise<MercadoPagoAdapter> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MercadoPagoAdapter, { provide: ConfigService, useValue: config }],
    }).compile();

    modules.push(module);
    return module.get<MercadoPagoAdapter>(MercadoPagoAdapter);
  }

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue(undefined) };
    modules = [];
  });

  afterEach(async () => {
    await Promise.all(modules.map((module) => module.close()));
  });

  it('returns a mock PIX intent without any network call, with no access token configured', async () => {
    const adapter = await buildAdapter();

    const result = await adapter.createIntent({
      amount: 100,
      method: PaymentMethod.pix,
      externalRef: 'order_1',
    });

    expect(result.status).toBe('pending');
    expect(result.qrCode).toBeDefined();
    expect(result.qrCodeBase64).toBeDefined();
    expect(result.checkoutUrl).toBeUndefined();
  });

  it('returns a mock checkout URL for credit_card, with no access token configured', async () => {
    const adapter = await buildAdapter();

    const result = await adapter.createIntent({
      amount: 50,
      method: PaymentMethod.credit_card,
      externalRef: 'order_2',
    });

    expect(result.checkoutUrl).toContain('sandbox.mercadopago.com');
    expect(result.qrCode).toBeUndefined();
  });

  it('still returns a mock intent even when MERCADO_PAGO_ACCESS_TOKEN is configured (real SDK not wired up yet)', async () => {
    config.get.mockReturnValue('fake-token');
    const adapter = await buildAdapter();

    const result = await adapter.createIntent({
      amount: 10,
      method: PaymentMethod.debit_card,
      externalRef: 'order_3',
    });

    expect(result.checkoutUrl).toContain('sandbox.mercadopago.com');
  });

  it('throws for an unsupported payment method', async () => {
    const adapter = await buildAdapter();

    await expect(
      adapter.createIntent({ amount: 10, method: PaymentMethod.cash, externalRef: 'order_4' }),
    ).rejects.toThrow('Metodo de pagamento nao suportado');
  });
});
