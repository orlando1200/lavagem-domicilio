import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AnalyticsController } from './analytics.controller';
import { AdminDashboardController } from './dashboard.admin.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController, AdminDashboardController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
