import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { MarketplaceService } from './marketplace.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ListProductsDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  ListSuppliersDto,
} from './dto/marketplace.dto';

@ApiTags('admin/marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/marketplace')
export class AdminMarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ─── Products ─────────────────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'List marketplace products' })
  async listProducts(@Query() query: ListProductsDto) {
    const result = await this.marketplaceService.listProducts(query);
    return {
      ...result,
      data: result.data.map(toProductResponse),
    };
  }

  @Post('products')
  @ApiOperation({ summary: 'Create marketplace product' })
  async createProduct(@Body() dto: CreateProductDto) {
    const product = await this.marketplaceService.createProduct(dto);
    return toProductResponse(product);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Update marketplace product' })
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.marketplaceService.updateProduct(id, dto);
    return toProductResponse(product);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Deactivate marketplace product' })
  removeProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.removeProduct(id);
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────

  @Get('suppliers')
  @ApiOperation({ summary: 'List marketplace suppliers' })
  async listSuppliers(@Query() query: ListSuppliersDto) {
    const result = await this.marketplaceService.listSuppliers(query);
    return {
      ...result,
      data: result.data.map(toSupplierResponse),
    };
  }

  @Get('suppliers/all')
  @ApiOperation({ summary: 'List all suppliers without pagination' })
  async listAllSuppliers() {
    const result = await this.marketplaceService.listSuppliers({ page: 1, limit: 1000 });
    return result.data.map(toSupplierResponse);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create marketplace supplier' })
  async createSupplier(@Body() dto: CreateSupplierDto) {
    const supplier = await this.marketplaceService.createSupplier(dto);
    return toSupplierResponse(supplier);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update marketplace supplier' })
  async updateSupplier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const supplier = await this.marketplaceService.updateSupplier(id, dto);
    return toSupplierResponse(supplier);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Deactivate marketplace supplier' })
  removeSupplier(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.removeSupplier(id);
  }
}

function toProductResponse(product: any) {
  const firstImage = product.images?.[0]?.url;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    supplierId: product.supplierId,
    supplier: product.supplier
      ? {
          id: product.supplier.id,
          name: product.supplier.name,
          email: product.supplier.email,
          phone: product.supplier.phone,
          document: product.supplier.document,
          active: product.supplier.status === 'active',
        }
      : undefined,
    category: product.category,
    price: Number(product.price),
    stock: product.stockQuantity ?? 0,
    unit: 'un',
    status: product.status,
    imageUrl: firstImage,
    isStarterKit: product.isStarterKit,
    createdAt: product.createdAt?.toISOString?.() ?? product.createdAt,
    updatedAt: product.updatedAt?.toISOString?.() ?? product.updatedAt,
  };
}

function toSupplierResponse(supplier: any) {
  return {
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    document: supplier.document,
    active: supplier.status === 'active',
    productsCount: supplier._count?.products ?? 0,
    createdAt: supplier.createdAt?.toISOString?.() ?? supplier.createdAt,
  };
}

    @Body() dto: SupplierOnboardingStatusDto,
  ) {
    const supplier = await this.marketplaceService.updateSupplierOnboardingStatus(id, dto);
    return toSupplierResponse(supplier);
  }

  // ─── Payouts ──────────────────────────────────────────────────────────────

  @Get('suppliers/:id/payouts')
  @ApiOperation({ summary: 'List supplier payouts' })
  async listSupplierPayouts(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.listSupplierPayouts(id);
  }

  @Post('suppliers/:id/payouts')
  @ApiOperation({ summary: 'Create supplier payout for period' })
  async createSupplierPayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { periodStart: string; periodEnd: string },
  ) {
    return this.marketplaceService.createPayout(
      id,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }
}

function toProductResponse(product: any) {
  const firstImage = product.images?.[0]?.url;
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    supplierId: product.supplierId,
    supplier: product.supplier
      ? {
          id: product.supplier.id,
          name: product.supplier.name,
          email: product.supplier.email,
          phone: product.supplier.phone,
          document: product.supplier.document,
          active: product.supplier.status === 'active',
        }
      : undefined,
    category: product.category,
    price: Number(product.price),
    stock: product.stockQuantity ?? 0,
    unit: 'un',
    status: product.status,
    approvalStatus: product.approvalStatus,
    storefront: product.storefront,
    rejectionReason: product.rejectionReason,
    imageUrl: firstImage,
    isStarterKit: product.isStarterKit,
    createdAt: product.createdAt?.toISOString?.() ?? product.createdAt,
    updatedAt: product.updatedAt?.toISOString?.() ?? product.updatedAt,
  };
}

function toSupplierResponse(supplier: any) {
  return {
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    phone: supplier.phone,
    document: supplier.document,
    status: supplier.status,
    plan: supplier.plan,
    logisticsType: supplier.logisticsType,
    monthlyFee: Number(supplier.monthlyFee),
    takeRate: Number(supplier.takeRate),
    minimumBilling: Number(supplier.minimumBilling),
    active: supplier.status === 'active',
    productsCount: supplier._count?.products ?? 0,
    createdAt: supplier.createdAt?.toISOString?.() ?? supplier.createdAt,
  };
}

