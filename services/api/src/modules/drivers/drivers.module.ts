import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { AdminWashersController } from './washers.admin.controller';
import { DriversService } from './drivers.service';

@Module({
  controllers: [DriversController, AdminWashersController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}
