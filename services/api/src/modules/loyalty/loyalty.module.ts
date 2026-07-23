import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { LoyaltyController } from './loyalty.controller';
import { AdminLoyaltyController } from './loyalty.admin.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  imports: [DatabaseModule],
  controllers: [LoyaltyController, AdminLoyaltyController],
  providers: [LoyaltyService],
})
export class LoyaltyModule {}
