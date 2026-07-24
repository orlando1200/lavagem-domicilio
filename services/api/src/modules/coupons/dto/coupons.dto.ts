import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CouponDiscountType } from '@prisma/client';

export class CreateCouponCampaignDto {
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @MaxLength(180)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Data de inicio da campanha (ISO 8601)' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ description: 'Data de termino da campanha (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponCampaignDto {
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
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCouponDto {
  @ApiProperty({ maxLength: 40, description: 'Codigo do cupom (unico), ex: BEMVINDO10' })
  @IsString()
  @MaxLength(40)
  code: string;

  @ApiProperty({ enum: CouponDiscountType })
  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @ApiProperty({ description: 'Valor do desconto (percentual 0-100 ou valor fixo em R$)' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  discountValue: number;

  @ApiPropertyOptional({ description: 'Numero maximo de usos do cupom' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Valor minimo do pedido para o cupom ser valido' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Data de expiracao do cupom (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Id da campanha vinculada' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ enum: CouponDiscountType })
  @IsOptional()
  @IsEnum(CouponDiscountType)
  discountType?: CouponDiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}

export class ListCouponsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}

/**
 * Usado no checkout (cliente/lojista) para validar um cupom antes de
 * fechar o pedido, informando o valor total para checar `minOrderAmount`.
 */
export class ValidateCouponDto {
  @ApiProperty({ description: 'Codigo do cupom informado pelo usuario' })
  @IsString()
  @MaxLength(40)
  code: string;

  @ApiProperty({ description: 'Valor total do pedido antes do desconto' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  orderAmount: number;
}
