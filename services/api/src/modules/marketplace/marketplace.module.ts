import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { MarketplaceService } from './marketplace.service';
import {
  SuppliersController,
  ProductsController,
  CatalogController,
  MarketplaceOrdersController,
  StorefrontController,
} from './marketplace.controller';
import { AdminMarketplaceController } from './marketplace.admin.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    SuppliersController,
    ProductsController,
    CatalogController,
    StorefrontController,
    MarketplaceOrdersController,
    AdminMarketplaceController,
  ],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
