import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { LoyaltyService } from './loyalty.service';

@ApiTags('admin/loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/loyalty')
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('orders/:orderId/grant')
  @ApiOperation({
    summary:
      'Concede pontos GIUCAR (5% do pedido) para um pedido pago. Hoje disparado manualmente; ' +
      'ponto de integracao para o futuro modulo de payments (webhook Mercado Pago) chamar quando ' +
      'o pagamento for confirmado.',
  })
  grantForOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.loyaltyService.grantForPaidOrder(orderId);
  }

  @Post('expire-overdue')
  @ApiOperation({
    summary:
      'Dispara manualmente a mesma rotina do job noturno (expira concessoes vencidas). Util para teste/operacao.',
  })
  expireOverdue() {
    return this.loyaltyService.expireOverduePoints();
  }
}
