import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@prisma/client';
import {
  CreatePaymentIntentParams,
  PaymentGatewayAdapter,
  PaymentIntentResult,
} from './payment-gateway.interface';

/**
 * Implementacao mock/sandbox do Mercado Pago — nunca chama a API real,
 * mesmo que `MERCADOPAGO_ACCESS_TOKEN` esteja definido (so loga um aviso
 * nesse caso, pra deixar claro que o token ainda nao esta sendo usado).
 * Cobre PIX e cartao (credito/debito), como pedido; gera um QR/checkout
 * mock deterministico e determinado localmente, sem I/O de rede.
 *
 * Quando o SDK real do Mercado Pago for integrado, so esta classe muda —
 * `PaymentsService` depende da interface `PaymentGatewayAdapter`, nao
 * desta implementacao.
 */
@Injectable()
export class MercadoPagoAdapter implements PaymentGatewayAdapter {
  private readonly logger = new Logger(MercadoPagoAdapter.name);

  constructor(private readonly config: ConfigService) {
    if (this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN')) {
      this.logger.warn(
        'MERCADOPAGO_ACCESS_TOKEN configurado, mas o adapter ainda esta em modo mock ' +
          '(integracao real com o SDK do Mercado Pago ainda nao foi implementada)',
      );
    }
  }

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const externalRef = params.externalRef || `mock_mp_${randomUUID()}`;

    if (params.method === PaymentMethod.pix) {
      const payload = `00020126580014BR.GOV.BCB.PIX0136${externalRef}5204000053039865802BR5913GIUCAR MOCK6009SAO PAULO`;

      return {
        externalRef,
        status: 'pending',
        method: params.method,
        qrCode: payload,
        qrCodeBase64: Buffer.from(payload).toString('base64'),
      };
    }

    if (params.method === PaymentMethod.credit_card || params.method === PaymentMethod.debit_card) {
      return {
        externalRef,
        status: 'pending',
        method: params.method,
        checkoutUrl: `https://sandbox.mercadopago.com/checkout/mock/${externalRef}`,
      };
    }

    throw new Error(`Metodo de pagamento nao suportado pelo adapter: ${params.method}`);
  }
}
