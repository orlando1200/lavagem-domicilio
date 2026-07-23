import { Module } from '@nestjs/common';
import { ZonesController } from './zones.controller';
import { AdminZonesController } from './zones.admin.controller';
import { ZonesService } from './zones.service';

@Module({
  controllers: [ZonesController, AdminZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
