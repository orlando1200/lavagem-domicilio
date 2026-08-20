import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { MockPlateLookupAdapter } from './plate-lookup/mock-plate-lookup.adapter';
import { PLATE_LOOKUP_GATEWAY } from './plate-lookup/plate-lookup-gateway.interface';

@Module({
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    MockPlateLookupAdapter,
    { provide: PLATE_LOOKUP_GATEWAY, useExisting: MockPlateLookupAdapter },
  ],
})
export class VehiclesModule {}
