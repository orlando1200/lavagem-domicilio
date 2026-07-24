import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { LogisticsPlan, StoreType } from '@prisma/client';

export class CreateStoreDto {
  @ApiProperty({ description: 'Id do usuario dono da loja (lojista)' })
  @IsString()
  @IsNotEmpty()
  ownerUserId!: string;

  @ApiProperty({ maxLength: 180 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @ApiProperty({ description: 'CNPJ ou CPF do lojista' })
  @IsString()
  @IsNotEmpty()
  document!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    enum: StoreType,
    description:
      'Publico alvo da loja: LAVADOR (vende insumos para lavadores) ou CLIENTE (vende produtos para clientes finais)',
  })
  @IsEnum(StoreType)
  storeType!: StoreType;

  @ApiPropertyOptional({
    enum: LogisticsPlan,
    default: LogisticsPlan.INTEGRATED,
    description:
      'INTEGRATED = logistica/fulfillment feita pela plataforma; OWN = lojista cuida da propria entrega',
  })
  @IsOptional()
  @IsEnum(LogisticsPlan)
  logisticsPlan?: LogisticsPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  address?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bankInfo?: Record<string, unknown>;
}
