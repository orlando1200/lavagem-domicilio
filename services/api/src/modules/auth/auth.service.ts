import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

  private signToken(id: string, email: string, role: string) {
    return this.jwtService.sign({ id, email, role });
  }
}
