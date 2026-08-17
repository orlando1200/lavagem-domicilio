import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DriverStatus, DriverType, ServiceType } from '@prisma/client';

/**
 * Cria o perfil de motorista/loja (`DriverProfile`) para o usuario
 * autenticado: moto (`MOTO_WASHER`), carro (`CAR_WASHER`) ou loja de
 * carwash (`CARWASH_SHOP` — habilita participacao em leiloes de servico
 * pesado). O usuario precisa ja existir (via cadastro em `users`) e ainda
 * nao ter um perfil.
 */
export class CreateDriverProfileDto {
  @ApiProperty({
    enum: DriverType,
    description: 'Tipo de perfil: moto, carro ou loja (carwash shop)',
  })
  @IsEnum(DriverType)
  driverType: DriverType;

  @ApiPropertyOptional({
    enum: ServiceType,
    isArray: true,
    description: 'Servicos que este perfil pode atender',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  allowedServices?: ServiceType[];

  @ApiPropertyOptional({ description: 'Raio de atendimento em quilometros', default: 5 })
  @IsOptional()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Id da zona de cobertura atual' })
  @IsOptional()
  @IsString()
  currentZoneId?: string;
}

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ enum: DriverType })
  @IsOptional()
  @IsEnum(DriverType)
  driverType?: DriverType;

  @ApiPropertyOptional({ enum: ServiceType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  allowedServices?: ServiceType[];

  @ApiPropertyOptional({ description: 'Raio de atendimento em quilometros' })
  @IsOptional()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Id da zona de cobertura atual' })
  @IsOptional()
  @IsString()
  currentZoneId?: string;
}

/**
 * Usado pelo proprio motorista/loja para se marcar como
 * disponivel/indisponivel para receber pedidos/leiloes. Mapeia para
 * `DriverProfile.status` (`active`/`inactive`), unico par de valores que
 * o proprio usuario pode alternar (demais status exigem admin).
 */
export class UpdateDriverProfileAvailabilityDto {
  @ApiProperty({
    enum: [DriverStatus.active, DriverStatus.inactive],
    description: 'active = disponivel, inactive = indisponivel',
  })
  @IsEnum(DriverStatus)
  status: DriverStatus;
}

/**
 * Reporta a posicao atual do lavador enquanto ha um pedido em
 * andamento (tracking em tempo real no mapa do cliente, via polling —
 * ver `GET /orders/:id/driver-location`).
 */
export class UpdateDriverLocationDto {
  @ApiProperty()
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @IsLongitude()
  longitude: number;
}

export class AdminUpdateDriverProfileStatusDto {
  @ApiProperty({ enum: DriverStatus })
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class ListDriverProfilesQueryDto {
  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional({ enum: DriverType })
  @IsOptional()
  @IsEnum(DriverType)
  driverType?: DriverType;

  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: string;
}
