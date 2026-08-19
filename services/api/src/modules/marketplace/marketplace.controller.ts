import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { MarketplaceService } from './marketplace.service';
import { CatalogQueryDto, CheckoutDto } from './dto/marketplace.dto';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('client/catalog')
  getClientCatalog(@Query() query: CatalogQueryDto) {
    return this.marketplaceService.getClientCatalog(query);
  }

  @Get('driver/catalog')
  getDriverCatalog(@Query() query: CatalogQueryDto) {
    return this.marketplaceService.getDriverCatalog(query);
  }

  @Get('products/:id')
  @ApiQuery({ name: 'vehicleId', required: false, description: 'Veiculo do comprador, pra calcular compatibility' })
  getProduct(@Param('id') id: string, @Query('vehicleId') vehicleId?: string) {
    return this.marketplaceService.getProductById(id, vehicleId);
  }

  @Post('client/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE, UserRole.LAVADOR)
  @ApiOperation({
    summary:
      'Finaliza a compra do carrinho: cria um ProductOrder por loja. ' +
      'Rota unica pros dois catalogos (CLIENTE em /client/catalog, LAVADOR ' +
      'em /driver/catalog) — o service e agnostico ao role do comprador.',
  })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.marketplaceService.checkout(user.id, dto);
  }
}
