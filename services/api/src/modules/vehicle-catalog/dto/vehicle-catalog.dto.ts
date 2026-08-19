import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleType } from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();

export class CreateVehicleBrandDto {
  @ApiProperty({ maxLength: 80 })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateVehicleBrandDto {
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateVehicleCatalogModelDto {
  @ApiProperty()
  @IsUUID()
  brandId: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateVehicleCatalogModelDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateVehicleCatalogYearDto {
  @ApiProperty()
  @IsUUID()
  modelId: string;

  @ApiProperty({ minimum: 1990 })
  @IsInt()
  @Min(1990)
  @Max(CURRENT_YEAR + 1)
  year: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateVehicleCatalogYearDto {
  @ApiPropertyOptional({ minimum: 1990 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(CURRENT_YEAR + 1)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ListVehicleCatalogModelsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;
}

export class ListVehicleCatalogYearsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  modelId?: string;
}
