import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CatalogTarget, ProductStatus, StoreStatus } from '@prisma/client';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

export class CatalogQueryDto extends CursorPaginationDto {
  @ApiPropertyOptional({ description: 'Filtra por categoria do produto' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Busca por nome do produto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Veiculo do comprador — quando informado, cada produto ganha um campo compatibility',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}

export class UpdateProductStatusDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsEnum(ProductStatus)
  status!: ProductStatus;

  @ApiPropertyOptional({
    description: 'Motivo obrigatorio quando status = rejected',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

/**
 * Store nasce sempre `pending` (`Store.status`, schema.prisma) — sem
 * este endpoint nenhuma loja criada via `POST /stores` conseguia
 * vender de verdade, mesmo com produtos ja aprovados (o catalogo so
 * lista produtos de lojas `active`, ver `getCatalogForTarget`). So o
 * seed contornava isso, criando a loja `active` direto via Prisma.
 */
export class UpdateStoreStatusDto {
  @ApiProperty({ enum: StoreStatus })
  @IsEnum(StoreStatus)
  status!: StoreStatus;
}

export class AdminListProductsDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filtra por loja' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Busca por nome do produto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}

/**
 * Snapshot do endereco de entrega informado no checkout — guardado
 * como JSON solto em `ProductOrder.shippingAddress` (mesma estrategia
 * de `Store.address`), nao um relacionamento com o model `Address`
 * (decisao de escopo: sem modulo de enderecos por enquanto). Campos
 * espelham o model `Address` ja existente no schema.
 */
export class ShippingAddressDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  complement?: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  neighborhood: string;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @ApiProperty({ minLength: 2, maxLength: 2 })
  @IsString()
  @Length(2, 2)
  state: string;

  @ApiProperty({ maxLength: 12 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  zipCode: string;
}

export class CheckoutItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CheckoutDto {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}

const CURRENT_YEAR = new Date().getFullYear();

export class FitmentRuleDto {
  @ApiPropertyOptional({ default: false, description: 'Compatível com qualquer veículo' })
  @IsOptional()
  @IsBoolean()
  universal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @ApiPropertyOptional({ minimum: 1990 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(CURRENT_YEAR + 1)
  yearFrom?: number;

  @ApiPropertyOptional({ minimum: 1990 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(CURRENT_YEAR + 1)
  yearTo?: number;
}

export class ReplaceFitmentsDto {
  @ApiProperty({ type: [FitmentRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FitmentRuleDto)
  fitments: FitmentRuleDto[];
}

export { CatalogTarget };
