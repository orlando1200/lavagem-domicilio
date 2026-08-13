import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { RentalStatus } from '@prisma/client';

export class CreateRentalDto {
  @ApiProperty({ description: 'Id do usuario locatario (lavador)' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Valor semanal do aluguel em reais' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weeklyRate: number;
}

export class AssignRentalDriverDto {
  @ApiProperty({ description: 'userId do DriverProfile a atribuir' })
  @IsUUID()
  driverId: string;
}

export class UpdateRentalStatusDto {
  @ApiProperty({ enum: RentalStatus })
  @IsEnum(RentalStatus)
  status: RentalStatus;
}

export class ListRentalsQueryDto {
  @ApiPropertyOptional({ enum: RentalStatus })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail do locatario' })
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
