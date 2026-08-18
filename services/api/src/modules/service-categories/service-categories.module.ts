import { Module } from '@nestjs/common';
import { AdminServiceCategoriesController } from './service-categories.admin.controller';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';

@Module({
  controllers: [AdminServiceCategoriesController, ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
