import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MarketplaceService } from './marketplace.service';
import {
  AdminListProductsDto,
  ReplaceFitmentsDto,
  UpdateProductStatusDto,
  UpdateStoreStatusDto,
} from './dto/marketplace.dto';

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

  @Patch('stores/:id/status')
  updateStoreStatus(@Param('id') id: string, @Body() dto: UpdateStoreStatusDto) {
    return this.marketplaceService.updateStoreStatus(id, dto);
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

  @Get('products/:id/fitments')
  listProductFitments(@Param('id') id: string) {
    return this.marketplaceService.listProductFitments(id);
  }

  @Post('products/:id/fitments')
  replaceProductFitments(@Param('id') id: string, @Body() dto: ReplaceFitmentsDto) {
    return this.marketplaceService.replaceProductFitments(id, dto);
  }

  @Delete('products/:id/fitments/:fitmentId')
  removeProductFitment(@Param('id') id: string, @Param('fitmentId') fitmentId: string) {
    return this.marketplaceService.removeProductFitment(id, fitmentId);
  }
}
