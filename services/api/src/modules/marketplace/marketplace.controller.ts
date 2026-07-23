import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { MarketplaceService } from './marketplace.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateProductDto,
  UpdateProductDto,
  ListProductsDto,
  CreateMarketplaceOrderDto,
  UpdateMarketplaceOrderStatusDto,
  ListMarketplaceOrdersDto,
  ListSuppliersDto,
  RegisterStoreDto,
  SubmitProductDto,
} from './dto/marketplace.dto';

// ─── Suppliers Controller ─────────────────────────────────────────────────────





































































































  }
}

// ─── Public Storefront Controller ─────────────────────────────────────────────

@ApiTags('marketplace')
@Controller('marketplace')
export class StorefrontController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('stores/register')
  @ApiOperation({ summary: 'Register a new supplier store (public, pending approval)' })
  async registerStore(@Body() dto: RegisterStoreDto) {
    return this.marketplaceService.registerStore(dto);
  }

  @Post('products/submit')
  @ApiOperation({ summary: 'Submit a product for approval (public, supplier must be active)' })
  async submitProduct(@Body() dto: SubmitProductDto) {
    return this.marketplaceService.submitProduct(dto);
  }

  @Get('catalog/washer')
  @ApiOperation({ summary: 'Public catalog for washer/professional storefront' })
  async getWasherCatalog(@Query() dto: ListProductsDto) {
    return this.marketplaceService.getStorefrontCatalog('washer', dto);
  }

  @Get('catalog/customer')
  @ApiOperation({ summary: 'Public catalog for customer/B2C storefront' })
  async getCustomerCatalog(@Query() dto: ListProductsDto) {
    return this.marketplaceService.getStorefrontCatalog('customer', dto);
  }
}

// ─── Public Catalog Controller ────────────────────────────────────────────────

@ApiTags('marketplace')
@Controller('marketplace/catalog')
export class CatalogController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @ApiOperation({ summary: 'Public product catalog (no auth required)' })
  getPublicCatalog(@Query() dto: ListProductsDto) {
    return this.marketplaceService.getPublicCatalog(dto);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active product by slug (no auth required)' })
  @ApiParam({ name: 'slug', type: String })
  getProductBySlug(@Param('slug') slug: string) {
    return this.marketplaceService.findOneProductBySlug(slug);
  }
}

// ─── Marketplace Orders Controller ───────────────────────────────────────────

