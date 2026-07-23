import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsPositive,
  IsUUID,
  MaxLength,
  Length,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RentalPartnerStatus, RentalOfferStatus, RentalLeadStatus, PricePeriod } from '@prisma/client';
import { CursorPaginationDto } from '@common/dto/pagination.dto';

// ─── Rental Partner DTOs ──────────────────────────────────────────────────────

export class CreateRentalPartnerDto {
  @ApiProperty()























































  status?: RentalPartnerStatus;
}

export class ListRentalPartnersDto extends CursorPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ enum: RentalPartnerStatus })
  @IsOptional()
  @IsEnum(RentalPartnerStatus)
  status?: RentalPartnerStatus;
}

// ─── Rental Offer DTOs ────────────────────────────────────────────────────────

  status?: RentalPartnerStatus;
}

// ─── Rental Offer DTOs ────────────────────────────────────────────────────────









































































  status?: RentalOfferStatus;
}

export class ListRentalOffersDto extends CursorPaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ enum: RentalOfferStatus })
  @IsOptional()
  @IsEnum(RentalOfferStatus)
  status?: RentalOfferStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
