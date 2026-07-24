import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { AdminCouponsController } from './coupons.admin.controller';
import { CouponsService } from './coupons.service';

@Module({
  controllers: [CouponsController, AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
