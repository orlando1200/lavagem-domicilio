import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/** Metodos suportados por enquanto (item 7 do roadmap: "apenas PIX e cartao"). */
const SUPPORTED_METHODS = [
  PaymentMethod.pix,
  PaymentMethod.credit_card,
  PaymentMethod.debit_card,
];

/**
 * Exatamente um entre `orderId` (servico de lavagem) e `productOrderId`
 * (compra na loja do cliente) deve ser informado — validado no
 * `PaymentsService.createIntent`, ja que `class-validator` sozinho nao
 * expressa "XOR" de forma direta entre dois campos opcionais.
 */
export class CreatePaymentIntentDto {
  @ApiPropertyOptional({ description: 'Pedido de lavagem a ser pago' })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Pedido de produto (loja) a ser pago' })
  @IsOptional()
  @IsUUID()
  productOrderId?: string;

  @ApiProperty({
    enum: SUPPORTED_METHODS,
    description: 'PIX ou cartao (credito/debito) — demais metodos ainda nao suportados',
  })
  @IsEnum(PaymentMethod)
  @IsIn(SUPPORTED_METHODS)
  method: PaymentMethod;
}

export class PaymentWebhookDto {
  @ApiProperty({ description: 'Referencia externa retornada na criacao da intent' })
  @IsString()
  externalRef: string;

  @ApiProperty({
    enum: ['approved', 'rejected', 'pending'],
    description: 'Status reportado pelo gateway (formato mock do Mercado Pago)',
  })
  @IsIn(['approved', 'rejected', 'pending'])
  status: 'approved' | 'rejected' | 'pending';
}
