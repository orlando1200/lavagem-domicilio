import { PaymentMethod } from '@prisma/client';

export interface CreatePaymentIntentParams {
  amount: number;
  method: PaymentMethod;
  externalRef: string;
  description?: string;
}

export interface PaymentIntentResult {
  externalRef: string;
  /** Status inicial retornado pelo gateway no momento da criacao da intent. */
  status: 'pending' | 'authorized';
  method: PaymentMethod;
  /** Presente para `pix`: copia-e-cola do QR code. */
  qrCode?: string;
  /** Presente para `pix`: QR code em base64 (imagem), pronto pra renderizar no app. */
  qrCodeBase64?: string;
  /** Presente para `credit_card`/`debit_card`: URL de checkout hospedado pelo gateway. */
  checkoutUrl?: string;
}

/**
 * Porta para o provedor de pagamento. `MercadoPagoAdapter` hoje e uma
 * implementacao mock (sem `MERCADO_PAGO_ACCESS_TOKEN` configurado, nao ha
 * como chamar a API real) — qualquer implementacao futura (real ou de
 * outro provedor) so precisa satisfazer esta interface, sem tocar em
 * `PaymentsService`.
 */
export interface PaymentGatewayAdapter {
  createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
}

export const PAYMENT_GATEWAY_ADAPTER = Symbol('PAYMENT_GATEWAY_ADAPTER');
