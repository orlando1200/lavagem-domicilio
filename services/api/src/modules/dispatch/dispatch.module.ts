import { Module } from '@nestjs/common';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { DriverNotificationsGateway } from './driver-notifications.gateway';

@Module({
  controllers: [DispatchController],
  providers: [DispatchService, DriverNotificationsGateway],
  exports: [DispatchService, DriverNotificationsGateway],
})
export class DispatchModule {}

