import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { LogPushAdapter } from './push/log-push.adapter';
import { PUSH_GATEWAY_ADAPTER } from './push/push-gateway.interface';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    LogPushAdapter,
    { provide: PUSH_GATEWAY_ADAPTER, useExisting: LogPushAdapter },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
