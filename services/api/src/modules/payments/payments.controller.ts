import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, PaymentWebhookDto } from './dto/payments.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Cria uma intent de pagamento (PIX ou cartao) para um pedido' })
  createIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createIntent(user.id, dto);
  }

  @Get('orders/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Consulta o pagamento do proprio pedido' })
  getMyPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    return this.paymentsService.getMyPayment(user.id, orderId);
  }

  @Get('product-orders/:productOrderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Consulta o pagamento do proprio pedido de produto (loja)' })
  getMyProductOrderPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productOrderId', ParseUUIDPipe) productOrderId: string,
  ) {
    return this.paymentsService.getMyPaymentForProductOrder(user.id, productOrderId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Callback do gateway de pagamento (Mercado Pago mock) — sem autenticacao' })
  handleWebhook(@Body() dto: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }
}
