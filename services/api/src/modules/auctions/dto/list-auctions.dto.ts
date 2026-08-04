import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuctionStatus } from '@prisma/client';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

export class ListAuctionsDto extends CursorPaginationDto {
  @ApiPropertyOptional({ enum: AuctionStatus })
  @IsOptional()
  @IsEnum(AuctionStatus)
  status?: AuctionStatus;
}

export class ListAvailableAuctionsDto extends CursorPaginationDto {}

export class ListMyBidsDto extends CursorPaginationDto {}

export class AdminListAuctionsDto {
  @ApiPropertyOptional({ enum: AuctionStatus })
  @IsOptional()
  @IsEnum(AuctionStatus)
  status?: AuctionStatus;

  @ApiPropertyOptional({ maxLength: 100, description: 'Busca por id do leilao ou do pedido' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}
