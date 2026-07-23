import { Module } from '@nestjs/common';
import { ServicesCatalogController } from './services-catalog.controller';
import { AdminCategoriesController } from './categories.admin.controller';
import { AdminServicesController, AdminServiceVehicleRulesController } from './services.admin.controller';
import { ServicesCatalogService } from './services-catalog.service';

@Module({
  controllers: [
    ServicesCatalogController,
    AdminCategoriesController,
    AdminServicesController,
    AdminServiceVehicleRulesController,
  ],
  providers: [ServicesCatalogService],
  exports: [ServicesCatalogService],
})
export class ServicesCatalogModule {}

