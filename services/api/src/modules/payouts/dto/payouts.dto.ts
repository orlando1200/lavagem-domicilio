import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PayoutStatus } from '@prisma/client';

export class RequestPayoutDto {
  @ApiProperty({ description: 'Amount to withdraw from wallet', minimum: 10 })






















  reason: string;
}

export class ListPayoutsDto {
  @ApiPropertyOptional({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filter by driver/user id' })
  @IsOptional()
  @IsUUID()
  washerId?: string;

  @ApiPropertyOptional({ description: 'Search by driver name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

