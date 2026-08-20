import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { createTestApp, resetDatabase, registerAndLogin, createAdminAndLogin } from './setup';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Porta o roteiro de docs/E2E_CHECKLIST.md (validado ao vivo em
 * 2026-08-13 contra o Docker real) para supertest — mesma sequencia,
 * mesmos gotchas ja descobertos (perfil de lavador nasce
 * pending_documents, precisa do passo 7a de ativacao pelo admin;
 * GET /orders/available devolve array puro, sem wrapper).
 */
describe('Fluxo critico: registro -> pedido -> aceite -> pagamento -> pontos (e2e)', () => {
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

  it('completa o fluxo de ponta a ponta e credita pontos GIUCAR', async () => {
    const http = () => request(app.getHttpServer());

    // Passo 0 — admin + zona de cobertura (bairro precisa bater com o endereco do Passo 4).
    const { token: adminToken } = await createAdminAndLogin(app, prisma);
    const zoneRes = await http()
      .post('/api/v1/admin/zones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        city: 'São Paulo',
        state: 'SP',
        name: 'Centro E2E',
        slug: 'centro-e2e',
        neighborhoods: ['Sé', 'República', 'Bela Vista', 'Consolação'],
        isActive: true,
      })
      .expect(201);
    const zoneId = zoneRes.body.id as string;

    // Passos 1-2 — cliente registrado e logado.
    const { token: clientToken } = await registerAndLogin(app, 'CLIENTE');

    // Passo 3 — veiculo.
    const vehicleRes = await http()
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ type: 'carro', brand: 'Fiat', model: 'Argo', color: 'Prata', plate: 'TST1E22' })
      .expect(201);
    const vehicleId = vehicleRes.body.id as string;

    // Passo 4 — endereco (bairro "Sé" bate com a zona criada acima).
    const addressRes = await http()
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        street: 'Rua da Sé',
        number: '100',
        neighborhood: 'Sé',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001-000',
      })
      .expect(201);
    const addressId = addressRes.body.id as string;

    // Passo 5 — pedido (DRY_WASH, matching automatico).
    const orderRes = await http()
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        vehicleId,
        addressId,
        serviceType: 'DRY_WASH',
        items: [{ name: 'Lavagem completa', price: 80, quantity: 1 }],
      })
      .expect(201);
    const orderId = orderRes.body.id as string;
    expect(orderRes.body.status).toBe('searching_washer');
    expect(orderRes.body.zoneId).toBe(zoneId);

    // Passo 6 — lavador registrado.
    const { token: lavadorToken, user: lavadorUser } = await registerAndLogin(app, 'LAVADOR');

    // Passo 7 — perfil de lavador (nasce pending_documents).
    const profileRes = await http()
      .post('/api/v1/driver-profiles/me')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .send({
        driverType: 'MOTO_WASHER',
        allowedServices: ['DRY_WASH', 'EXPRESS_WASH'],
        currentZoneId: zoneId,
      })
      .expect(201);
    expect(profileRes.body.status).toBe('pending_documents');

    // Passo 7a — ativacao pelo admin (self-service nao funciona nesse estado).
    await http()
      .patch(`/api/v1/admin/driver-profiles/${lavadorUser.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' })
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('active'));

    // Passo 8 — pedido visivel no array puro de disponiveis.
    const availableRes = await http()
      .get('/api/v1/orders/available')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(200);
    expect(Array.isArray(availableRes.body)).toBe(true);
    expect(availableRes.body.some((o: { id: string }) => o.id === orderId)).toBe(true);

    // Passo 9 — aceite.
    const acceptRes = await http()
      .patch(`/api/v1/orders/${orderId}/accept`)
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(200);
    expect(acceptRes.body.status).toBe('accepted');
    expect(acceptRes.body.driverId).toBe(lavadorUser.id);

    // Pular direto de "accepted" pra "completed" (sem passar por
    // en_route/in_progress) deve falhar — 400.
    await http()
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${lavadorToken}`)
      .send({ status: 'completed' })
      .expect(400);

    // Passo 10 — maquina de estados, uma transicao por vez.
    for (const status of ['en_route', 'in_progress', 'completed']) {
      const res = await http()
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${lavadorToken}`)
        .send({ status })
        .expect(200);
      expect(res.body.status).toBe(status);
    }

    // Passo 11 — pagamento (modo mock, sem MERCADO_PAGO_ACCESS_TOKEN).
    const paymentRes = await http()
      .post('/api/v1/payments/intent')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ orderId, method: 'pix' })
      .expect(201);
    expect(paymentRes.body.payment.status).toBe('pending');
    expect(paymentRes.body.gateway.qrCode).toBeTruthy();
    const externalRef = paymentRes.body.payment.externalRef as string;

    // Passo 12 — webhook (sem auth) confirma o pagamento.
    const webhookRes = await http()
      .post('/api/v1/payments/webhook')
      .send({ externalRef, status: 'approved' })
      .expect(201);
    expect(webhookRes.body.status).toBe('paid');

    // Passo 13 — saldo de pontos GIUCAR (5% de R$80 = 400 pontos).
    const loyaltyRes = await http()
      .get('/api/v1/loyalty/balance')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);
    expect(loyaltyRes.body.balance).toBe(400);
    expect(loyaltyRes.body.balanceValue).toBe(4);
  });
});
