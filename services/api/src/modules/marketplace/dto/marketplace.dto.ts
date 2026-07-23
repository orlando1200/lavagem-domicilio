import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CommissionType, ProductStatus, SupplierStatus, MarketplaceOrderStatus } from '@prisma/client';
import { CursorPaginationDto } from '@common/dto/pagination.dto';

class OffsetPaginationMixin {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

// ─── Supplier DTOs ────────────────────────────────────────────────────────────

export class CreateSupplierDto {
  @ApiProperty()
  @ApiProperty()
  @IsString()
  @MaxLength(180)
  name: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  document: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: StorePlan, default: StorePlan.integrated_logistics })
  @IsOptional()
  @IsEnum(StorePlan)
  plan?: StorePlan;

  @ApiPropertyOptional({ enum: LogisticsType, default: LogisticsType.platform })
  @IsOptional()
  @IsEnum(LogisticsType)
  logisticsType?: LogisticsType;

  @ApiPropertyOptional()
  @IsOptional()
  address?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  bankInfo?: Record<string, unknown>;
}

export class RegisterStoreDto extends CreateSupplierDto {}

export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()

// ─── Product DTOs ─────────────────────────────────────────────────────────────

export class CreateProductDto {
  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Min(0)
  commissionValue: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStarterKit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: CommissionType })
  weightGrams?: number;
}

export class ListProductsDto extends CursorPaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

// ─── Marketplace Order DTOs ───────────────────────────────────────────────────

export class CreateMarketplaceOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;
// ─── Marketplace Order DTOs ───────────────────────────────────────────────────

export class CreateMarketplaceOrderItemDto {
  @ApiProperty()
  isStarterKit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

// ─── Marketplace Order DTOs ───────────────────────────────────────────────────


export class SubmitProductDto extends CreateProductDto {}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: CommissionType })
  supplierId?: string;
}

export class ListSuppliersDto extends CursorPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}

  @IsOptional()
  @IsBoolean()
  isStarterKit?: boolean;

  @ApiPropertyOptional({ enum: ProductStorefront })
  @IsOptional()
  @IsEnum(ProductStorefront)
  storefront?: ProductStorefront;
}

export class ApproveProductDto {
  @ApiProperty({ enum: ProductApprovalStatus })
  @IsEnum(ProductApprovalStatus)
  approvalStatus: ProductApprovalStatus;

  @ApiPropertyOptional({ enum: ProductStorefront })
  @IsOptional()
  @IsEnum(ProductStorefront)
  supplierId?: string;
}

export class ListSuppliersDto extends CursorPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}

  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ProductApprovalStatus })
  @IsOptional()
  @IsEnum(ProductApprovalStatus)
  approvalStatus?: ProductApprovalStatus;

  @ApiPropertyOptional({ enum: ProductStorefront })
  @IsOptional()
  @IsEnum(ProductStorefront)
  storefront?: ProductStorefront;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStarterKit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

export class ListPendingProductsDto extends ListProductsDto {}

// ─── Marketplace Order DTOs ───────────────────────────────────────────────────

