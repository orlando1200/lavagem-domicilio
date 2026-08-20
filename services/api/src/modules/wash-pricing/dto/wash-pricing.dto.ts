import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CarSize, WashType } from '@prisma/client';

export class CreateWashPriceDto {
  @ApiProperty({ enum: CarSize })
  @IsEnum(CarSize)
  carSize: CarSize;

  @ApiProperty({ enum: WashType })
  @IsEnum(WashType)
  washType: WashType;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateWashPriceDto {
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
