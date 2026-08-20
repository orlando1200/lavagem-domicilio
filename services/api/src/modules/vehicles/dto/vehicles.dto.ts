import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CarSize, VehicleType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  brand: string;

  @ApiProperty({ maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  model: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiProperty({ maxLength: 10 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  plate: string;

  @ApiPropertyOptional({ description: 'Ano do catalogo estruturado (marca/modelo/ano), opcional' })
  @IsOptional()
  @IsUUID()
  catalogYearId?: string;

  @ApiPropertyOptional({ enum: CarSize, description: 'Tamanho pra precificacao da Lavagem por Tamanho' })
  @IsOptional()
  @IsEnum(CarSize)
  size?: CarSize;
}
