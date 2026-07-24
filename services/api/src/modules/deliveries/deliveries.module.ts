import { Module } from '@nestjs/common';
import { DriverDeliveriesController } from './driver-deliveries.controller';
import { AdminDeliveriesController } from './admin-deliveries.controller';
import { DeliveriesService } from './deliveries.service';

@Module({
  controllers: [DriverDeliveriesController, AdminDeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
