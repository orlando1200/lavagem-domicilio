import { Injectable, Logger } from '@nestjs/common';
import { EmailGatewayAdapter, SendEmailParams } from './email-gateway.interface';

/**
 * Implementacao mock de envio de e-mail — nunca manda e-mail de verdade,
 * so loga o conteudo. Nao existe nenhuma conta de e-mail/SMTP/SES
 * configurada neste projeto ainda.
 *
 * Quando um provedor real for integrado (SES, SMTP, Resend, etc.), so
 * esta classe muda — `EmailService`/quem consome depende da interface
 * `EmailGatewayAdapter`, nao desta implementacao (mesmo padrao ja usado
 * em `payments/adapters/mercado-pago.adapter.ts`).
 */
@Injectable()
export class LogEmailAdapter implements EmailGatewayAdapter {
  private readonly logger = new Logger(LogEmailAdapter.name);

  async send(params: SendEmailParams): Promise<void> {
    this.logger.log(
      `[email mock] Para: ${params.to} | Assunto: ${params.subject}\n${params.body}`,
    );
  }
}
