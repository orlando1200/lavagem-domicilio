import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { createTestApp, resetDatabase, registerAndLogin, createAdminAndLogin } from './setup';
import { PrismaService } from '../../src/database/prisma.service';

const SHIPPING_ADDRESS = {
  street: 'Rua Teste',
  number: '123',
  complement: '',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01000-000',
};

/**
 * Porta driver-shop-check.mjs (rodado ao vivo nesta sessão contra o
 * Docker real): confirma que POST /marketplace/client/checkout
 * funciona tanto pro catalogo CLIENTE quanto pro catalogo LAVADOR
 * (guard alargado pra @Roles(CLIENTE, LAVADOR) — a asserção central
 * é o LAVADOR nao levar mais 403) e que ADMIN continua bloqueado.
 */
describe('Marketplace: catalogo + checkout cross-role (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createApprovedProduct() {
    const http = () => request(app.getHttpServer());
    const { token: adminToken } = await createAdminAndLogin(app, prisma);
    const { token: ownerToken } = await registerAndLogin(app, 'LAVADOR');

    const storeRes = await http()
      .post('/api/v1/stores')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Loja E2E', document: '12345678900', storeType: 'CLIENTE' })
      .expect(201);
    const storeId = storeRes.body.id as string;

    // Loja nasce "pending" — sem aprovar, o catalogo nunca a lista
    // (getCatalogForTarget filtra store: {status: active}) e o
    // checkout falha com 400 mesmo com produto aprovado.
    await http()
      .patch(`/api/v1/admin/marketplace/stores/${storeId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' })
      .expect(200);

    const productRes = await http()
      .post(`/api/v1/stores/${storeId}/products`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Produto E2E', price: 29.9, stockQuantity: 50, catalogTarget: 'AMBOS' })
      .expect(201);
    const productId = productRes.body.id as string;

    await http()
      .patch(`/api/v1/admin/marketplace/products/${productId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' })
      .expect(200);

    return { productId, adminToken };
  }

  it('checkout como LAVADOR funciona (era 403 antes do guard ser alargado)', async () => {
    const { productId } = await createApprovedProduct();
    const { token: buyerToken } = await registerAndLogin(app, 'LAVADOR');

    const catalogRes = await request(app.getHttpServer())
      .get('/api/v1/marketplace/driver/catalog')
      .expect(200);
    expect(catalogRes.body.items.some((p: { id: string }) => p.id === productId)).toBe(true);

    const checkoutRes = await request(app.getHttpServer())
      .post('/api/v1/marketplace/client/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId, quantity: 1 }], shippingAddress: SHIPPING_ADDRESS })
      .expect(201);

    expect(checkoutRes.body.orders).toHaveLength(1);
    expect(checkoutRes.body.orders[0].status).toBe('pending');
  });

  it('checkout como CLIENTE continua funcionando (sem regressao)', async () => {
    const { productId } = await createApprovedProduct();
    const { token: buyerToken } = await registerAndLogin(app, 'CLIENTE');

    await request(app.getHttpServer())
      .post('/api/v1/marketplace/client/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ items: [{ productId, quantity: 1 }], shippingAddress: SHIPPING_ADDRESS })
      .expect(201);
  });

  it('checkout como ADMIN continua bloqueado (guard nao ficou aberto demais)', async () => {
    const { productId, adminToken } = await createApprovedProduct();

    await request(app.getHttpServer())
      .post('/api/v1/marketplace/client/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ productId, quantity: 1 }], shippingAddress: SHIPPING_ADDRESS })
      .expect(403);
  });
});
