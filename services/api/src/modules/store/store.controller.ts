import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { CreateStoreProductDto } from './dto/create-store-product.dto';

/**
 * Gestao da propria loja do lojista (dados sensiveis: `bankInfo`,
 * `commissionPlan`, produtos em qualquer status, pedidos recebidos) —
 * nunca vitrine publica. Catalogo/produto publicos ficam no modulo
 * `marketplace`.
 */
@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR, UserRole.ADMIN)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  createStore(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStoreDto) {
    return this.storeService.createStore(user.id, dto);
  }

  @Get(':id')
  getStore(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.storeService.findStoreForOwner(id, user);
  }

  @Post(':id/products')
  createProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') storeId: string,
    @Body() dto: CreateStoreProductDto,
  ) {
    return this.storeService.createProduct(storeId, user, dto);
  }

  @Get(':id/products')
  listProducts(@CurrentUser() user: AuthenticatedUser, @Param('id') storeId: string) {
    return this.storeService.listProductsByStore(storeId, user);
  }

  @Get(':id/orders')
  listOrders(@CurrentUser() user: AuthenticatedUser, @Param('id') storeId: string) {
    return this.storeService.listOrdersByStore(storeId, user);
  }
}
