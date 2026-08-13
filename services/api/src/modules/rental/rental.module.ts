import { Module } from '@nestjs/common';
import { AdminRentalController } from './rental.admin.controller';
import { RentalService } from './rental.service';

@Module({
  controllers: [AdminRentalController],
  providers: [RentalService],
  exports: [RentalService],
})
export class RentalModule {}
