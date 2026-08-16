import { Module } from '@nestjs/common';
import { AdminZonesController } from './zones.admin.controller';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

@Module({
  controllers: [AdminZonesController, ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
