import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller';
import { AdminLoyaltyController } from './loyalty.admin.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  controllers: [LoyaltyController, AdminLoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
