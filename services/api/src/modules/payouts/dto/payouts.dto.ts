import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PayoutStatus } from '@prisma/client';

export class GenerateWasherPayoutDto {
  @ApiProperty({ description: 'Id do lavador (Washer.userId)' })
  @IsUUID()
  washerId: string;

  @ApiProperty({ description: 'Inicio do periodo apurado (ISO 8601)' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Fim do periodo apurado (ISO 8601)' })
  @IsDateString()
  periodEnd: string;

  @ApiPropertyOptional({
    description: 'Percentual de comissao da plataforma sobre o bruto (0-100). Default 0.',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}

export class GenerateStorePayoutDto {
  @ApiProperty({ description: 'Id da loja (Store.id)' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Inicio do periodo apurado (ISO 8601)' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Fim do periodo apurado (ISO 8601)' })
  @IsDateString()
  periodEnd: string;
}

export class UpdatePayoutStatusDto {
  @ApiProperty({ enum: PayoutStatus })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiPropertyOptional({ description: 'Motivo da rejeicao (obrigatorio quando status = rejected)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Referencia externa do provedor de pagamento (ex: id da transferencia)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  providerReference?: string;
}

export class ListPayoutsQueryDto {
  @ApiPropertyOptional({ enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filtra por lavador (Washer.userId)' })
  @IsOptional()
  @IsUUID()
  washerId?: string;

  @ApiPropertyOptional({ description: 'Filtra por loja (Store.id)' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}
