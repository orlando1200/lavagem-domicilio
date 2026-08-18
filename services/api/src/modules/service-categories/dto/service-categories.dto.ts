import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { ServiceType } from '@prisma/client';

/**
 * HEAVY_SERVICE fica de fora — nao tem preco fixo (vai a leilao, modulo
 * `auctions`), continua tratado como caso especial hardcoded no cliente.
 */
const CATALOGABLE_SERVICE_TYPES = [ServiceType.DRY_WASH, ServiceType.EXPRESS_WASH];

export class CreateServiceCategoryDto {
  @ApiProperty({ enum: CATALOGABLE_SERVICE_TYPES })
  @IsIn(CATALOGABLE_SERVICE_TYPES)
  serviceType: ServiceType;

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateServiceCategoryDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
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
  @IsBoolean()
  active?: boolean;
}
