import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { AdminPayoutsController } from './payouts.admin.controller';
import { PayoutsService } from './payouts.service';

@Module({
  controllers: [PayoutsController, AdminPayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
