import { Module } from '@nestjs/common';
import { AdminVehicleCatalogController } from './vehicle-catalog.admin.controller';
import { VehicleCatalogController } from './vehicle-catalog.controller';
import { VehicleCatalogService } from './vehicle-catalog.service';

@Module({
  controllers: [AdminVehicleCatalogController, VehicleCatalogController],
  providers: [VehicleCatalogService],
  exports: [VehicleCatalogService],
})
export class VehicleCatalogModule {}
