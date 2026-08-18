import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request = require('supertest');
import { createTestApp, resetDatabase, registerAndLogin } from './setup';
import { PrismaService } from '../../src/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra um CLIENTE e devolve um token valido', async () => {
    const { token, user } = await registerAndLogin(app, 'CLIENTE');
    expect(token).toBeTruthy();
    expect(user.role).toBe('CLIENTE');
  });

  it('registra um LAVADOR e devolve um token valido', async () => {
    const { user } = await registerAndLogin(app, 'LAVADOR');
    expect(user.role).toBe('LAVADOR');
  });

  it('rejeita registro com e-mail duplicado (409)', async () => {
    const { body } = await registerAndLogin(app, 'CLIENTE');

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...body, phone: '11999998888' })
      .expect(409);
  });

  it('login com senha errada retorna 401', async () => {
    const { body } = await registerAndLogin(app, 'CLIENTE');

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: 'senha-errada' })
      .expect(401);
  });

  it('login correto retorna o mesmo role do registro', async () => {
    const { body } = await registerAndLogin(app, 'LAVADOR');

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password })
      .expect(201);

    expect(res.body.user.role).toBe('LAVADOR');
    expect(res.body.accessToken).toBeTruthy();
  });

  it('registro publico rejeita role ADMIN', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Tentativa Admin',
        email: 'tentativa.admin@e2e.test',
        phone: '11999997777',
        password: 'Senha123!',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('forgot-password responde generico tanto para e-mail existente quanto inexistente', async () => {
    const { body } = await registerAndLogin(app, 'CLIENTE');

    const resExisting = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: body.email })
      .expect(201);

    const resMissing = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nao.existe@e2e.test' })
      .expect(201);

    expect(resExisting.body.message).toBe(resMissing.body.message);
  });

  it('reset-password com token valido troca a senha e permite login com a nova', async () => {
    const { body } = await registerAndLogin(app, 'CLIENTE');
    const user = await prisma.user.findUniqueOrThrow({ where: { email: body.email } });

    const resetToken = jwtService.sign(
      { id: user.id, purpose: 'password_reset' },
      { expiresIn: '15m' },
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'NovaSenha123!' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: body.password })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: body.email, password: 'NovaSenha123!' })
      .expect(201);
  });

  it('reset-password rejeita token sem purpose password_reset (ex.: token de sessao normal)', async () => {
    const { token } = await registerAndLogin(app, 'CLIENTE');

    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token, newPassword: 'NovaSenha123!' })
      .expect(401);
  });

  it('reset-password rejeita token invalido', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token: 'token-invalido', newPassword: 'NovaSenha123!' })
      .expect(401);
  });
});
