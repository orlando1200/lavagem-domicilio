import { Module } from '@nestjs/common';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceAdminController } from './marketplace.admin.controller';
import { MarketplaceService } from './marketplace.service';
import { FitmentImportService } from './fitment-import.service';

@Module({
  controllers: [MarketplaceController, MarketplaceAdminController],
  providers: [MarketplaceService, FitmentImportService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
