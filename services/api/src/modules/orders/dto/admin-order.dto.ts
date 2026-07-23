import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class AdminOrderListDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  washerId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  driverUserId: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

