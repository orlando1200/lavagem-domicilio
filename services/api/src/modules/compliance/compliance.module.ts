import { Module } from '@nestjs/common';
import { ComplianceController, AdminComplianceController } from './compliance.controller';
import { AdminComplianceController as AdminComplianceV2Controller } from './compliance.admin.controller';
import { ComplianceService } from './compliance.service';
import { FaceCheckModule } from '@modules/face-check/face-check.module';
import { DocumentVerificationModule } from '@modules/document-verification/document-verification.module';

@Module({
  imports: [FaceCheckModule, DocumentVerificationModule],
  controllers: [ComplianceController, AdminComplianceController, AdminComplianceV2Controller],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}

