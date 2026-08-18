import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './orders.admin.controller';
import { OrdersService } from './orders.service';
import { MapsModule } from '../maps/maps.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MapsModule, NotificationsModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
