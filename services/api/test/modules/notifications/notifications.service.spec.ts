import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';
import { PrismaService } from '../../../src/database/prisma.service';

const USER_ID = 'user-1';
const NOTIFICATION_ID = 'notif-1';

function notification(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: NOTIFICATION_ID,
    userId: USER_ID,
    type: 'order_accepted',
    title: 'Seu pedido foi aceito!',
    body: 'Um lavador aceitou seu pedido.',
    relatedEntityId: null,
    read: false,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let module: TestingModule;
  let prisma: {
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(NotificationsService);
  });

  afterEach(() => module.close());

  it('create grava a notificacao com os campos informados', async () => {
    prisma.notification.create.mockResolvedValue(notification());

    await service.create(USER_ID, {
      type: 'order_accepted',
      title: 'Seu pedido foi aceito!',
      body: 'Um lavador aceitou seu pedido.',
      relatedEntityId: 'order-1',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          type: 'order_accepted',
          relatedEntityId: 'order-1',
        }),
      }),
    );
  });

  it('listMine filtra por read quando informado na query', async () => {
    prisma.notification.findMany.mockResolvedValue([notification()]);

    await service.listMine(USER_ID, { read: 'false' });

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID, read: false } }),
    );
  });

  it('listMine sem filtro so restringe por userId', async () => {
    prisma.notification.findMany.mockResolvedValue([]);

    await service.listMine(USER_ID, {});

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
  });

  it('countUnread conta apenas as nao lidas do usuario', async () => {
    prisma.notification.count.mockResolvedValue(3);

    const result = await service.countUnread(USER_ID);

    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
    });
    expect(result).toBe(3);
  });

  it('markAsRead marca como lida quando a notificacao pertence ao usuario', async () => {
    prisma.notification.findUnique.mockResolvedValue(notification());
    prisma.notification.update.mockResolvedValue(notification({ read: true }));

    const result = await service.markAsRead(USER_ID, NOTIFICATION_ID);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: NOTIFICATION_ID },
      data: { read: true },
    });
    expect(result.read).toBe(true);
  });

  it('markAsRead lanca NotFoundException quando a notificacao nao existe', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await expect(service.markAsRead(USER_ID, NOTIFICATION_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markAsRead lanca NotFoundException quando a notificacao e de outro usuario', async () => {
    prisma.notification.findUnique.mockResolvedValue(notification({ userId: 'other-user' }));

    await expect(service.markAsRead(USER_ID, NOTIFICATION_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('markAllAsRead marca todas as nao lidas do usuario', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 5 });

    const result = await service.markAllAsRead(USER_ID);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, read: false },
      data: { read: true },
    });
    expect(result.message).toContain('lidas');
  });
});
