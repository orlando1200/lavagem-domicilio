import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  getProduct(@Param('id') id: string) {
    return this.marketplaceService.getProductById(id);
  }

  @Post('client/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENTE)
  @ApiOperation({ summary: 'Cliente finaliza a compra do carrinho: cria um ProductOrder por loja' })
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.marketplaceService.checkout(user.id, dto);
  }
}
