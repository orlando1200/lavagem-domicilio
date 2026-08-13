import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { AdminSupportController } from './support.admin.controller';
import { SupportService } from './support.service';

@Module({
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
