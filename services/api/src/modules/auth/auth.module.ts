import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Gerado uma unica vez em memoria se `JWT_SECRET` nao estiver setado — no
 * lugar de um fallback hardcoded/publico no codigo-fonte (que qualquer um
 * lendo o repositorio conseguiria usar pra forjar um token de ADMIN valido
 * contra uma instancia rodando sem a env var real). Sessoes nao sobrevivem
 * a um restart do processo sem `JWT_SECRET` configurado de verdade — esse
 * comportamento e esperado, nao um bug.
 */
let ephemeralJwtSecret: string | undefined;
function getEphemeralJwtSecret(): string {
  if (!ephemeralJwtSecret) {
    ephemeralJwtSecret = randomBytes(48).toString('hex');
    new Logger('AuthModule').warn(
      'JWT_SECRET nao configurado — usando segredo aleatorio gerado em memoria para esta execucao. Sessoes serao invalidadas a cada restart. Configure JWT_SECRET para producao.',
    );
  }
  return ephemeralJwtSecret;
}

@Module({
  imports: [
    UsersModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? getEphemeralJwtSecret(),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
