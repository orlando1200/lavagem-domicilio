import { Module } from '@nestjs/common';
import { AdminZonesController } from './zones.admin.controller';
import { ZonesService } from './zones.service';

@Module({
  controllers: [AdminZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
