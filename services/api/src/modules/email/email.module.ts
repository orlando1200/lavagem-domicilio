import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { LogEmailAdapter } from './log-email.adapter';
import { EMAIL_GATEWAY_ADAPTER } from './email-gateway.interface';

@Module({
  providers: [
    EmailService,
    LogEmailAdapter,
    { provide: EMAIL_GATEWAY_ADAPTER, useExisting: LogEmailAdapter },
  ],
  exports: [EmailService],
})
export class EmailModule {}
