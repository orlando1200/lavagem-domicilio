import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaService } from '../../../src/database/prisma.service';

const USER_ID = 'user-1';

function user(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    name: 'Orlando Silva',
    email: 'orlando@example.com',
    phone: null,
    avatarUrl: null,
    passwordHash: 'hashed-current-password',
    role: UserRole.CLIENTE,
    status: UserStatus.active,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let module: TestingModule;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('createUser', () => {
    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(user());

      await expect(
        service.createUser({
          name: 'Novo Usuario',
          email: 'orlando@example.com',
          password: 'senha12345',
          role: UserRole.CLIENTE,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and returns the user without passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => Promise.resolve(user(data)));

      const result = await service.createUser({
        name: 'Novo Usuario',
        email: 'novo@example.com',
        password: 'senha12345',
        role: UserRole.CLIENTE,
      });

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('senha12345');
      expect(await bcrypt.compare('senha12345', createdData.passwordHash)).toBe(true);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('getProfile', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the sanitized user when found', async () => {
      prisma.user.findUnique.mockResolvedValue(user());

      const result = await service.getProfile(USER_ID);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe(USER_ID);
    });
  });

  describe('updateProfile', () => {
    it('updates only the fields provided, hashing the password when included', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      await service.updateProfile(USER_ID, { name: 'Nome Novo', password: 'nova-senha123' });

      const updateData = prisma.user.update.mock.calls[0][0].data;
      expect(updateData.name).toBe('Nome Novo');
      expect(updateData.phone).toBeUndefined();
      expect(await bcrypt.compare('nova-senha123', updateData.passwordHash)).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(USER_ID, { currentPassword: 'x', newPassword: 'y'.repeat(8) }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws UnauthorizedException when the current password does not match', async () => {
      const currentHash = await bcrypt.hash('senha-atual', 10);
      prisma.user.findUnique.mockResolvedValue(user({ passwordHash: currentHash }));

      await expect(
        service.changePassword(USER_ID, {
          currentPassword: 'senha-errada',
          newPassword: 'senha-nova123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes and persists the new password when the current one matches', async () => {
      const currentHash = await bcrypt.hash('senha-atual', 10);
      prisma.user.findUnique.mockResolvedValue(user({ passwordHash: currentHash }));
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      const result = await service.changePassword(USER_ID, {
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova123',
      });

      const updateData = prisma.user.update.mock.calls[0][0].data;
      expect(await bcrypt.compare('senha-nova123', updateData.passwordHash)).toBe(true);
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('deleteOwnAccount', () => {
    it('sets the user status to inactive', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      await service.deleteOwnAccount(USER_ID);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: UserStatus.inactive } }),
      );
    });
  });

  describe('getUserById', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById(USER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateUserRole', () => {
    it('throws BadRequestException when demoting the last remaining admin', async () => {
      prisma.user.findUnique.mockResolvedValue(user({ role: UserRole.ADMIN }));
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.updateUserRole(USER_ID, { role: UserRole.CLIENTE }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows demoting an admin when other admins remain', async () => {
      prisma.user.findUnique.mockResolvedValue(user({ role: UserRole.ADMIN }));
      prisma.user.count.mockResolvedValue(2);
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      const result = await service.updateUserRole(USER_ID, { role: UserRole.CLIENTE });

      expect(result.role).toBe(UserRole.CLIENTE);
    });
  });

  describe('updateUserStatus', () => {
    it('updates the user status', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      const result = await service.updateUserStatus(USER_ID, { status: UserStatus.blocked });

      expect(result.status).toBe(UserStatus.blocked);
    });
  });

  describe('deleteUserAsAdmin', () => {
    it('sets the user status to blocked', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.update.mockImplementation(({ data }) => Promise.resolve(user(data)));

      await service.deleteUserAsAdmin(USER_ID);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: UserStatus.blocked } }),
      );
    });
  });
});
