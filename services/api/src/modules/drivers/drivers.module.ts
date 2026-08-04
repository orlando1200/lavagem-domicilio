import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { AdminWashersController } from './washers.admin.controller';
import { DriversService } from './drivers.service';
import { DriverProfilesController } from './driver-profiles.controller';
import { AdminDriverProfilesController } from './driver-profiles.admin.controller';
import { DriverProfilesService } from './driver-profiles.service';

@Module({
  controllers: [
    DriversController,
    AdminWashersController,
    DriverProfilesController,
    AdminDriverProfilesController,
  ],
  providers: [DriversService, DriverProfilesService],
  exports: [DriversService, DriverProfilesService],
})
export class DriversModule {}
