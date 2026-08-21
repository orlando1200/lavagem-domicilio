import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * `setup.ts.resetDatabase()` da TRUNCATE em toda tabela entre specs — e
 * `test:e2e` nao tinha nenhum override de `DATABASE_URL`, entao rodar
 * localmente sem cuidado apontava pro MESMO banco de dev do `.env`
 * (aconteceu de verdade nesta sessao: apagou os usuarios de seed sem
 * querer). No CI isso e seguro porque o job `api` do ci.yml define
 * `DATABASE_URL` apontando pra `lavagem_domicilio_test` via `env:` do
 * job — mas localmente ninguem lembra de fazer esse override na mao.
 *
 * Roda como `setupFiles`, ou seja ANTES de qualquer spec importar
 * Prisma/AppModule — mas isso e cedo demais pro `ConfigModule.forRoot()`
 * ja ter carregado o `.env` (isso so acontece dentro de
 * `createTestApp()`, no `beforeAll` de cada spec). Por isso le o
 * `.env` aqui manualmente (`dotenv.parse`, sem tocar em process.env
 * ainda) so pra descobrir o DATABASE_URL base, deriva o nome do banco
 * de teste e ja deixa em `process.env.DATABASE_URL` **antes** do
 * `ConfigModule` rodar — dotenv, por padrao, nunca sobrescreve uma env
 * var que ja existe, entao o valor forcado aqui sobrevive.
 */
if (!process.env.CI) {
  const envPath = join(__dirname, '../../.env');
  const baseUrl = existsSync(envPath) ? dotenv.parse(readFileSync(envPath)).DATABASE_URL : undefined;

  if (baseUrl) {
    const match = baseUrl.match(/^(.*\/)([^/?]+)(\?.*)?$/);
    if (match) {
      const [, prefix, dbName, query = ''] = match;
      const testDbName = dbName.endsWith('_test') ? dbName : `${dbName}_test`;
      process.env.DATABASE_URL = `${prefix}${testDbName}${query}`;
    }
  }
}
