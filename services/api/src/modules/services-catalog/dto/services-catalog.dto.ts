import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;
}

export class CreateServiceCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 100;
}

export class CreateServiceCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  isActive?: boolean;
}

export class ServicePriceInputDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  size: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateServiceDto {
  @ApiProperty()
  @IsUUID()
  categoryId: string;











































  @IsString()
  riskLevel?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ServicePriceInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceInputDto)
  prices?: ServicePriceInputDto[];
}

export class UpdateServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()












































  @IsString()
  riskLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ServicePriceInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicePriceInputDto)
  prices?: ServicePriceInputDto[];
}

export class CreateServiceVehicleRuleDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
