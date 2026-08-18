import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SALT_ROUNDS = 10;
const PASSWORD_RESET_PURPOSE = 'password_reset';
const PASSWORD_RESET_EXPIRES_IN = '15m';

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha invalidos');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha invalidos');
    }

    const accessToken = this.signToken(user.id, user.email, user.role);

    return {
      accessToken,
      user: sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const user = await this.usersService.createUser(dto);
    const accessToken = this.signToken(user.id, user.email, user.role);

    return {
      accessToken,
      user,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Se o e-mail existir em nossa base, enviamos instrucoes para redefinir a senha.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return genericResponse;
    }

    const resetToken = this.jwtService.sign(
      { id: user.id, purpose: PASSWORD_RESET_PURPOSE },
      { expiresIn: PASSWORD_RESET_EXPIRES_IN },
    );

    await this.emailService.send({
      to: user.email,
      subject: 'Redefinicao de senha - GIUCAR',
      body: `Use o token abaixo para redefinir sua senha (valido por 15 minutos):\n\n${resetToken}`,
    });

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    let payload: { id: string; purpose?: string };

    try {
      payload = this.jwtService.verify(dto.token);
    } catch {
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    if (payload.purpose !== PASSWORD_RESET_PURPOSE) {
      throw new UnauthorizedException('Token invalido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: payload.id },
      data: { passwordHash },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  private signToken(id: string, email: string, role: string) {
    return this.jwtService.sign({ id, email, role });
  }
}
