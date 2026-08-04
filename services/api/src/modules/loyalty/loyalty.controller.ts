import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { LoyaltyService } from './loyalty.service';
import { ListLoyaltyHistoryDto, RedeemLoyaltyPointsDto } from './dto/loyalty.dto';

@ApiTags('loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENTE)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Saldo de pontos GIUCAR disponivel do cliente autenticado' })
  getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.loyaltyService.getBalance(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historico de concessoes e resgates de pontos do cliente autenticado' })
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListLoyaltyHistoryDto,
  ) {
    return this.loyaltyService.getHistory(user.id, query);
  }

  @Post('redeem')
  @ApiOperation({ summary: 'Resgata pontos GIUCAR como desconto em um pedido' })
  redeem(@CurrentUser() user: AuthenticatedUser, @Body() dto: RedeemLoyaltyPointsDto) {
    return this.loyaltyService.redeemPoints(user.id, dto);
  }
}
