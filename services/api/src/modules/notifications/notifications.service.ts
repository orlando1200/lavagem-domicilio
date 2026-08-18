import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListNotificationsQueryDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma notificacao para o usuario. Chamado inline de outros
   * services (pedido aceito, pagamento confirmado, documento revisado)
   * — nunca exposto por controller.
   */
  create(userId: string, params: { type: string; title: string; body: string; relatedEntityId?: string }) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        relatedEntityId: params.relatedEntityId,
      },
    });
  }

  listMine(userId: string, query: ListNotificationsQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.read !== undefined ? { read: query.read === 'true' } : {}),
    };

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificacao nao encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'Todas as notificacoes foram marcadas como lidas.' };
  }
}
