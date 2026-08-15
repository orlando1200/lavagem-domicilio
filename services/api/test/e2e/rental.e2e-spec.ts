import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { createTestApp, resetDatabase, registerAndLogin, createAdminAndLogin } from './setup';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Porta rental-check.mjs (rodado ao vivo nesta sessão): autoservico
 * de aluguel de moto do lavador — solicitacao nasce sem preco
 * definido, so o admin confirma o weeklyRate real na aprovacao.
 */
describe('Aluguel de moto: autoservico do lavador (e2e)', () => {
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

  it('completa o fluxo: solicita -> bloqueia duplicata -> admin aprova com valor -> reflete em GET /rentals/me', async () => {
    const http = () => request(app.getHttpServer());
    const { token: lavadorToken, user: lavadorUser } = await registerAndLogin(app, 'LAVADOR');

    // Antes de qualquer solicitacao, GET /rentals/me nao tem corpo (200, vazio).
    const before = await http()
      .get('/api/v1/rentals/me')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(200);
    expect(before.body).toEqual({});

    // Solicita o aluguel (autoservico) — nasce sem preco definido.
    const requestRes = await http()
      .post('/api/v1/rentals/me/request')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(201);
    expect(requestRes.body.status).toBe('requested');
    expect(Number(requestRes.body.weeklyRate)).toBe(0);
    const rentalId = requestRes.body.id as string;

    // GET /rentals/me agora reflete a solicitacao.
    const afterRequest = await http()
      .get('/api/v1/rentals/me')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(200);
    expect(afterRequest.body.id).toBe(rentalId);

    // Segunda solicitacao enquanto ha uma requested/active em andamento -> 409.
    await http()
      .post('/api/v1/rentals/me/request')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(409);

    // Admin precisa de um DriverProfile pra atribuir.
    const { token: adminToken } = await createAdminAndLogin(app, prisma);
    await http()
      .post('/api/v1/driver-profiles/me')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .send({ driverType: 'MOTO_WASHER', allowedServices: ['DRY_WASH'] })
      .expect(201);

    // Admin aprova e confirma o valor semanal real.
    const approveRes = await http()
      .patch(`/api/v1/admin/rentals/${rentalId}/assign-driver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ driverId: lavadorUser.id, weeklyRate: 150 })
      .expect(200);
    expect(approveRes.body.status).toBe('active');
    expect(Number(approveRes.body.weeklyRate)).toBe(150);

    // GET /rentals/me reflete o aluguel ativo com o valor confirmado.
    const final = await http()
      .get('/api/v1/rentals/me')
      .set('Authorization', `Bearer ${lavadorToken}`)
      .expect(200);
    expect(final.body.status).toBe('active');
    expect(Number(final.body.weeklyRate)).toBe(150);
  });
});
