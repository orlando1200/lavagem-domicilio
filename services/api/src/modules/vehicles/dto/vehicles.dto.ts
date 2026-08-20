import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { CarSize, VehicleType } from '@prisma/client';

// Placa antiga (AAA-1234/AAA1234) ou Mercosul (AAA1A23) — hifen opcional.
export const PLATE_REGEX = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
// RENAVAM: 11 digitos (padrao atual de veiculo em circulacao).
export const RENAVAM_REGEX = /^\d{11}$/;

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

  @ApiProperty({ maxLength: 10, description: 'Placa antiga (AAA1234) ou Mercosul (AAA1A23)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Matches(PLATE_REGEX, { message: 'Placa em formato invalido' })
  plate: string;

  @ApiPropertyOptional({ description: 'Ano do catalogo estruturado (marca/modelo/ano), opcional' })
  @IsOptional()
  @IsUUID()
  catalogYearId?: string;

  @ApiPropertyOptional({ enum: CarSize, description: 'Tamanho pra precificacao da Lavagem por Tamanho' })
  @IsOptional()
  @IsEnum(CarSize)
  size?: CarSize;

  @ApiPropertyOptional({ description: 'RENAVAM (11 digitos), opcional' })
  @IsOptional()
  @IsString()
  @Matches(RENAVAM_REGEX, { message: 'RENAVAM deve ter 11 digitos' })
  renavam?: string;
}

export class LookupPlateParamsDto {
  @ApiProperty({ description: 'Placa antiga ou Mercosul, com ou sem hifen' })
  @IsString()
  @Matches(PLATE_REGEX, { message: 'Placa em formato invalido' })
  plate: string;
}
