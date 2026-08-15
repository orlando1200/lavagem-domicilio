import { Module } from '@nestjs/common';
import { AdminRentalController } from './rental.admin.controller';
import { RentalController } from './rental.controller';
import { RentalService } from './rental.service';

@Module({
  controllers: [AdminRentalController, RentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}
