import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request = require('supertest');
import { UserRole } from '@prisma/client';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

/**
 * Sobe a aplicacao Nest real (mesmos guards/pipes/prefixo do
 * src/main.ts) contra o Postgres apontado por DATABASE_URL — nao
 * mocka nada, diferente dos testes unitarios em test/modules/**.
 */
export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}

/**
 * Trunca todas as tabelas da app (menos a de controle de migrations)
 * entre specs, sem precisar manter uma lista hardcoded — o schema
 * cresce com frequencia neste projeto.
 */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const names = tables.map((t) => `"${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
}

const rnd = () => Math.random().toString(36).slice(2, 10);

/**
 * Registra um usuario novo (CLIENTE ou LAVADOR — POST /auth/register
 * nao aceita ADMIN, por design) e devolve o token + o corpo da
 * resposta, evitando repetir o boilerplate de registro em cada spec.
 */
export async function registerAndLogin(
  app: INestApplication,
  role: 'CLIENTE' | 'LAVADOR',
  overrides: Partial<{ name: string; email: string; phone: string; password: string }> = {},
) {
  const suffix = rnd();
  const body = {
    name: overrides.name ?? `Teste ${role} ${suffix}`,
    email: overrides.email ?? `${role.toLowerCase()}.${suffix}@e2e.test`,
    phone: overrides.phone ?? `119${suffix}`.padEnd(11, '0').slice(0, 11),
    password: overrides.password ?? 'Senha123!',
    role,
  };

  const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(body).expect(201);

  return { token: res.body.accessToken as string, user: res.body.user, body };
}

/**
 * Cria um ADMIN direto via Prisma (POST /auth/register rejeita esse
 * role de proposito, ver register.dto.ts) e loga pelo endpoint real
 * — mesma tecnica usada pra criar o admin de bootstrap em produção
 * nesta sessão. Não depende do seed (`resetDatabase` trunca tudo
 * entre specs, incluindo qualquer admin semeado).
 */
export async function createAdminAndLogin(app: INestApplication, prisma: PrismaService) {
  const suffix = rnd();
  const email = `admin.${suffix}@e2e.test`;
  const passwordHash = await bcrypt.hash('Senha123!', 10);

  await prisma.user.create({
    data: {
      name: `Admin Teste ${suffix}`,
      email,
      phone: `118${suffix}`.padEnd(11, '0').slice(0, 11),
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password: 'Senha123!' })
    .expect(201);

  return { token: res.body.accessToken as string, user: res.body.user };
}
