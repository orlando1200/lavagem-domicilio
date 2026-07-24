import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { CatalogTarget } from '@prisma/client';

export class CreateStoreProductDto {
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

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

  @ApiProperty({ description: 'Preco unitario em reais' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    enum: CatalogTarget,
    default: CatalogTarget.AMBOS,
    description:
      'Para qual catalogo o produto aparece: LAVADOR, CLIENTE ou AMBOS',
  })
  @IsOptional()
  @IsEnum(CatalogTarget)
  catalogTarget?: CatalogTarget;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number;
}
