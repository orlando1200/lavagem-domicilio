import { Module } from '@nestjs/common';
import { DriverProfilesController } from './driver-profiles.controller';
import { AdminDriverProfilesController } from './driver-profiles.admin.controller';
import { DriverProfilesService } from './driver-profiles.service';

@Module({
  controllers: [DriverProfilesController, AdminDriverProfilesController],
  providers: [DriverProfilesService],
  exports: [DriverProfilesService],
})
export class DriversModule {}
