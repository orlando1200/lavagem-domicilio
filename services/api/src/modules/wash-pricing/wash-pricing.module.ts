import { Module } from '@nestjs/common';
import { AdminWashPricingController } from './wash-pricing.admin.controller';
import { WashPricingController } from './wash-pricing.controller';
import { WashPricingService } from './wash-pricing.service';

@Module({
  controllers: [AdminWashPricingController, WashPricingController],
  providers: [WashPricingService],
  exports: [WashPricingService],
})
export class WashPricingModule {}
