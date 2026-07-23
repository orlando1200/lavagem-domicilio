import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { DriversService } from './drivers.service';
import { DriversController, AdminDriversController } from './drivers.controller';
import { AdminWashersController } from './washers.admin.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [DriversController, AdminDriversController, AdminWashersController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}

