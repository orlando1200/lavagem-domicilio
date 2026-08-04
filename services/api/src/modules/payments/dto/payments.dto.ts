import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/** Metodos suportados por enquanto (item 7 do roadmap: "apenas PIX e cartao"). */
const SUPPORTED_METHODS = [
  PaymentMethod.pix,
  PaymentMethod.credit_card,
  PaymentMethod.debit_card,
];

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Pedido a ser pago' })
  @IsUUID()
  orderId: string;

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
