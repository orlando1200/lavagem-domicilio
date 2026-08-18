import { Module } from '@nestjs/common';
import { DocumentVerificationController } from './document-verification.controller';
import { AdminDocumentVerificationController } from './document-verification.admin.controller';
import { DocumentVerificationService } from './document-verification.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DocumentVerificationController, AdminDocumentVerificationController],
  providers: [DocumentVerificationService],
  exports: [DocumentVerificationService],
})
export class DocumentVerificationModule {}
