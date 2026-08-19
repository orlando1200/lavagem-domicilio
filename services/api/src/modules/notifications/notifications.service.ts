import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ListNotificationsQueryDto } from './dto/notifications.dto';
import { PUSH_GATEWAY_ADAPTER, PushGatewayAdapter } from './push/push-gateway.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_GATEWAY_ADAPTER) private readonly pushGateway: PushGatewayAdapter,
  ) {}

  /**
   * Cria uma notificacao para o usuario. Chamado inline de outros
   * services (pedido aceito, pagamento confirmado, documento revisado)
   * — nunca exposto por controller. Alem de gravar a notificacao
   * in-app, dispara push best-effort (nunca quebra o fluxo principal)
   * pros dispositivos registrados do usuario.
   */
  async create(userId: string, params: { type: string; title: string; body: string; relatedEntityId?: string }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        relatedEntityId: params.relatedEntityId,
      },
    });

    await this.sendPushBestEffort(userId, params.title, params.body);

    return notification;
  }

  private async sendPushBestEffort(userId: string, title: string, body: string) {
    try {
      const tokens = await this.prisma.pushToken.findMany({
        where: { userId },
        select: { token: true },
      });
      await this.pushGateway.send(tokens.map((t) => t.token), { title, body });
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel enviar push para o usuario ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Registra o token de push do dispositivo atual (idempotente — se o
   * token ja existe, so atualiza o dono/plataforma; um mesmo aparelho
   * pode trocar de usuario entre logins).
   */
  registerPushToken(userId: string, token: string, platform?: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async unregisterPushToken(userId: string, token: string) {
    await this.prisma.pushToken.deleteMany({ where: { userId, token } });
    return { message: 'Token removido.' };
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
