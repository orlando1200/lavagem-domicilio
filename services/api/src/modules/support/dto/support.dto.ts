import { Type } from 'class-transformer';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsUUID,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupportTicketDto {
  @ApiProperty({ enum: TicketCategory })
  @IsEnum(TicketCategory)
  category: TicketCategory;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(180)
  subject: string;

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  description: string;
}

export class ListSupportTicketsDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UpdateSupportTicketDto extends PartialType(CreateSupportTicketDto) {
  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedAdminUserId?: string;
}

