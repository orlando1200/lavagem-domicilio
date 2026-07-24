import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceAdminController } from './marketplace.admin.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  controllers: [MarketplaceController, MarketplaceAdminController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
