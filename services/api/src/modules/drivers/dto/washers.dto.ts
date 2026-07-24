import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { WasherStatus } from '@prisma/client';

/**
 * Cria o perfil de lavador (`Washer`) para o usuario autenticado.
 * O usuario precisa ja existir (via cadastro em `users`) e ainda nao ter
 * um perfil de lavador.
 */
export class CreateWasherProfileDto {
  @ApiPropertyOptional({
    description: 'Raio de atendimento em quilometros',
    default: 5,
  })
  @IsOptional()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Id da zona de cobertura atual' })
  @IsOptional()
  @IsString()
  currentZoneId?: string;
}

export class UpdateWasherProfileDto {
  @ApiPropertyOptional({ description: 'Raio de atendimento em quilometros' })
  @IsOptional()
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Id da zona de cobertura atual' })
  @IsOptional()
  @IsString()
  currentZoneId?: string;
}

/**
 * Usado pelo proprio lavador para se marcar como disponivel/indisponivel
 * para receber pedidos. Mapeia para `Washer.status` (`active`/`inactive`),
 * unico campo do schema que representa esse estado.
 */
export class UpdateWasherAvailabilityDto {
  @ApiProperty({
    enum: [WasherStatus.active, WasherStatus.inactive],
    description: 'active = disponivel para novos pedidos, inactive = indisponivel',
  })
  @IsEnum(WasherStatus)
  status: WasherStatus;
}

export class AdminUpdateWasherStatusDto {
  @ApiProperty({ enum: WasherStatus })
  @IsEnum(WasherStatus)
  status: WasherStatus;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class ListWashersQueryDto {
  @ApiPropertyOptional({ enum: WasherStatus })
  @IsOptional()
  @IsEnum(WasherStatus)
  status?: WasherStatus;

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
