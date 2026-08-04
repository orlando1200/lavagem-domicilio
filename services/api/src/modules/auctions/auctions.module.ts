import { Module } from '@nestjs/common';
import { AuctionsController } from './auctions.controller';
import { AdminAuctionsController } from './auctions.admin.controller';
import { AuctionsService } from './auctions.service';
import { AuctionsNotificationsService } from './auctions-notifications.service';

@Module({
  controllers: [AuctionsController, AdminAuctionsController],
  providers: [AuctionsService, AuctionsNotificationsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
