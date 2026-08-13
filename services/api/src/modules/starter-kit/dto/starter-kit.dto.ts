import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { StarterKitStatus } from '@prisma/client';

export class CreateStarterKitDto {
  @ApiProperty({ description: 'userId do lavador (DriverProfile.userId)' })
  @IsUUID()
  washerId: string;

  @ApiProperty({ description: 'Preco do kit inicial em reais' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ default: 1, description: 'Numero de parcelas' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installments?: number;
}

export class UpdateStarterKitStatusDto {
  @ApiProperty({ enum: StarterKitStatus })
  @IsEnum(StarterKitStatus)
  status: StarterKitStatus;
}

export class ListStarterKitsQueryDto {
  @ApiPropertyOptional({ enum: StarterKitStatus })
  @IsOptional()
  @IsEnum(StarterKitStatus)
  status?: StarterKitStatus;

  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail do lavador' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}
