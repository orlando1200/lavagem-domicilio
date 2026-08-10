import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MarketplaceService } from './marketplace.service';
import { AdminListProductsDto, UpdateProductStatusDto } from './dto/marketplace.dto';

@ApiTags('admin-marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/marketplace')
export class MarketplaceAdminController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('stores')
  listStores() {
    return this.marketplaceService.listStoresForAdmin();
  }

  @Get('products')
  listProducts(@Query() query: AdminListProductsDto) {
    return this.marketplaceService.listProductsForAdmin(query);
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.marketplaceService.updateProductStatus(id, dto);
  }
}
