import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_GATEWAY_ADAPTER, EmailGatewayAdapter, SendEmailParams } from './email-gateway.interface';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_GATEWAY_ADAPTER) private readonly gateway: EmailGatewayAdapter,
  ) {}

  send(params: SendEmailParams): Promise<void> {
    return this.gateway.send(params);
  }
}
