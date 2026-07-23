import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { AdminRepaymentsController } from './repayments.admin.controller';
import { PayoutsService } from './payouts.service';
import { DatabaseModule } from '@database/database.module';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
  imports: [DatabaseModule, WalletModule],
  controllers: [PayoutsController, AdminRepaymentsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}

