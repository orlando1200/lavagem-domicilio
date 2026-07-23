import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty()





















  @IsBoolean()
  surgeEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  neighborhoods?: string[];
}

export class UpdateZoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()























  @IsBoolean()
  surgeEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  neighborhoods?: string[];
}

export class CreateZonePricingRuleDto {
  @ApiProperty()


































































  surgeMaxMultiplier?: number;
}

export class ListZonesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by state (UF)', example: 'SP' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @ApiPropertyOptional({ description: 'Include inactive zones', default: false })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

