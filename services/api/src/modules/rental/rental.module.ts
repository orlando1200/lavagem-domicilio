import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { RentalService } from './rental.service';
import {
  RentalPartnersController,
  RentalOffersController,
  RentalLeadsController,
} from './rental.controller';
import { AdminMotoRentalController } from './moto-rental.admin.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [
    RentalPartnersController,
    RentalOffersController,
    RentalLeadsController,
    AdminMotoRentalController,
  ],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}

