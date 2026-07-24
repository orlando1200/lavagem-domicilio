import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { CouponsService } from './coupons.service';
import { ValidateCouponDto } from './dto/coupons.dto';

/**
 * Endpoints de cupom disponiveis para cliente e lojista (qualquer usuario
 * autenticado) usarem durante o checkout - complementa a Loja do Cliente
 * e o fluxo de pedidos de servico.
 */
@ApiTags('coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Valida um cupom para o valor do pedido informado' })
  validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(dto);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Registra o resgate de um cupom apos confirmacao do pagamento' })
  redeemCoupon(
    @CurrentUser() user: AuthenticatedUser,
    @Body('code') code: string,
  ) {
    return this.couponsService.redeemCoupon(code, user.id);
  }
}
