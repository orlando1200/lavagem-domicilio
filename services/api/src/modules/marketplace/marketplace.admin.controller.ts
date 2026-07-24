import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { UpdateProductStatusDto } from './dto/marketplace.dto';

@ApiTags('admin-marketplace')
@Controller('admin/marketplace')
export class MarketplaceAdminController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('stores')
  listStores() {
    return this.marketplaceService.listStoresForAdmin();
  }

  @Patch('products/:id/status')
  updateProductStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.marketplaceService.updateProductStatus(id, dto);
  }
}
