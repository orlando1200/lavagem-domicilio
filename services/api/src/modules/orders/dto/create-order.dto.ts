import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({ maxLength: 180 })
  @IsString()
  @MaxLength(180)
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Veiculo a ser lavado' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ description: 'Endereco onde o servico sera realizado' })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({ description: 'Zona de cobertura (se conhecida pelo app)' })
  @IsOptional()
  @IsUUID()
  zoneId?: string;

  @ApiPropertyOptional({
    enum: ServiceType,
    description:
      'Categoria do servico, usada no matching por perfil (driverType). HEAVY_SERVICE ' +
      'nao passa pelo matching normal — vai direto para o modulo de leiloes (auctions).',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ description: 'Data/hora agendada do servico' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
