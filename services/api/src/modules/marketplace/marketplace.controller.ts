import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CatalogQueryDto } from './dto/marketplace.dto';

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
}
