import { Module } from '@nestjs/common';
import { DocumentVerificationController } from './document-verification.controller';
import { AdminDocumentVerificationController } from './document-verification.admin.controller';
import { DocumentVerificationService } from './document-verification.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [NotificationsModule, StorageModule],
  controllers: [DocumentVerificationController, AdminDocumentVerificationController],
  providers: [DocumentVerificationService],
  exports: [DocumentVerificationService],
})
export class DocumentVerificationModule {}
