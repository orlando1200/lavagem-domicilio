import { Injectable, Logger } from '@nestjs/common';
import { PushGatewayAdapter, PushMessage } from './push-gateway.interface';

/**
 * Push notifications em modo simulado — so loga, nunca chama nenhum
 * servico externo. Nao existe projeto Firebase configurado ainda (sem
 * `google-services.json`/service account); quando existir, trocar por
 * um adapter real do Firebase Admin SDK e implementar so essa mesma
 * interface, sem tocar em quem consome `PushGatewayAdapter`.
 */
@Injectable()
export class LogPushAdapter implements PushGatewayAdapter {
  private readonly logger = new Logger(LogPushAdapter.name);

  async send(tokens: string[], message: PushMessage): Promise<void> {
    if (tokens.length === 0) return;
    this.logger.log(
      `[push mock] Para ${tokens.length} dispositivo(s) | ${message.title} | ${message.body}`,
    );
  }
}
