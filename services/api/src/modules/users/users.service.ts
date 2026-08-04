import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ListUsersQueryDto,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/update-user.dto';

const SALT_ROUNDS = 10;

/** Campos sensiveis que nunca devem ser retornados ao cliente. */
function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Usado pelo modulo de auth (login/registro). Mantido publico para
   * permitir que outros modulos criem usuarios sem duplicar a logica de
   * hash de senha/verificacao de e-mail duplicado.
   */
  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail ja cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
    });

    return sanitizeUser(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        vehicles: true,
        driverProfile: true,
        washer: true,
        cashbackBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    await this.ensureUserExists(userId);

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return sanitizeUser(user);
  }

  async deleteOwnAccount(userId: string) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.inactive },
    });

    return sanitizeUser(user);
  }

  async listUsers(query: ListUsersQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items.map((u) => sanitizeUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        vehicles: true,
        driverProfile: true,
        washer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return sanitizeUser(user);
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status },
    });

    return sanitizeUser(user);
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const existing = await this.ensureUserExists(userId);

    if (existing.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Nao e possivel remover o unico administrador do sistema',
        );
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
    });

    return sanitizeUser(user);
  }

  async deleteUserAsAdmin(userId: string) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.blocked },
    });

    return sanitizeUser(user);
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return user;
  }
}
