import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class AdminListOrdersDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  washerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}

export class AdminAssignDriverDto {
  @ApiPropertyOptional()
  @IsUUID()
  driverUserId: string;
}

export class AdminUpdateStatusDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(50)
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AdminSendChatMessageDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(2000)
  message: string;
}

