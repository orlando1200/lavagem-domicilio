import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoAdapter } from './adapters/mercado-pago.adapter';
import { PAYMENT_GATEWAY_ADAPTER } from './adapters/payment-gateway.interface';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [LoyaltyModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MercadoPagoAdapter,
    { provide: PAYMENT_GATEWAY_ADAPTER, useExisting: MercadoPagoAdapter },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
