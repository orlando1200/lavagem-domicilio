import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKitCheckoutDto {
  @ApiProperty({ description: 'Number of installments (1 to maxInstallments)', minimum: 1 })















  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Minimum price (BRL)', example: 900 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price (BRL)', example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum installments allowed', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  maxInstallments?: number;

  @ApiPropertyOptional({ description: 'Whether this config is active' })
  @IsOptional()
