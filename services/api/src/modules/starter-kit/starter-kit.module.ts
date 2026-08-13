import { Module } from '@nestjs/common';
import { AdminStarterKitController } from './starter-kit.admin.controller';
import { StarterKitService } from './starter-kit.service';

@Module({
  controllers: [AdminStarterKitController],
  providers: [StarterKitService],
  exports: [StarterKitService],
})
export class StarterKitModule {}
