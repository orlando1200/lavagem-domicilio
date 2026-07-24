import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { PayoutsService } from './payouts.service';

/**
 * Consulta dos proprios repasses - lavador ve seus repasses de servico,
 * lojista ve os repasses da sua loja.
 */
@ApiTags('payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payouts/me')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('washer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LAVADOR)
  @ApiOperation({ summary: 'Lista os repasses do lavador autenticado' })
  listMyWasherPayouts(@CurrentUser() user: AuthenticatedUser) {
    return this.payoutsService.listMyWasherPayouts(user.id);
  }

  @Get('store')
  @ApiOperation({ summary: 'Lista os repasses da loja do usuario autenticado' })
  listMyStorePayouts(@CurrentUser() user: AuthenticatedUser) {
    return this.payoutsService.listMyStorePayouts(user.id);
  }
}
