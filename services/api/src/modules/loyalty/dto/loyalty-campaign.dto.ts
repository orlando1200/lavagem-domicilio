import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoyaltyCampaignStatus, LoyaltyRewardType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLoyaltyCampaignDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: LoyaltyRewardType })
  @IsEnum(LoyaltyRewardType)
  rewardType: LoyaltyRewardType;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsCost: number;

  @ApiProperty()
  @Type(() => Number)
  @IsDecimal({ decimal_digits: '0,2' })
  rewardValue: number;

  @ApiPropertyOptional({ enum: LoyaltyCampaignStatus, default: LoyaltyCampaignStatus.draft })
  @IsOptional()
  @IsEnum(LoyaltyCampaignStatus)
  status?: LoyaltyCampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class UpdateLoyaltyCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: LoyaltyRewardType })
  @IsOptional()
  @IsEnum(LoyaltyRewardType)
  rewardType?: LoyaltyRewardType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  rewardValue?: number;

  @ApiPropertyOptional({ enum: LoyaltyCampaignStatus })
  @IsOptional()
  @IsEnum(LoyaltyCampaignStatus)
  status?: LoyaltyCampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string;
}

export class ListLoyaltyCampaignsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LoyaltyCampaignStatus })
  @IsOptional()
  @IsEnum(LoyaltyCampaignStatus)
  status?: LoyaltyCampaignStatus;
}

