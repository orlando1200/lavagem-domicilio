import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { CatalogTarget } from '@prisma/client';

/**
 * Edicao do proprio lojista — nunca inclui `pending_approval`/`rejected`,
 * essa transicao e exclusiva do admin
 * (`PATCH /admin/marketplace/products/:id/status`). Aqui o lojista so
 * alterna `active`/`inactive` num produto ja aprovado.
 */
export class UpdateStoreProductDto {
  @ApiPropertyOptional({ maxLength: 180 })
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
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Preco unitario em reais' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: CatalogTarget })
  @IsOptional()
  @IsEnum(CatalogTarget)
  catalogTarget?: CatalogTarget;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
    description: 'Pausar/reativar um produto ja aprovado — nunca aprova/rejeita',
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
