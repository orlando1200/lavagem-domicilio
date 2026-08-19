import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por lidas (true) ou nao lidas (false)' })
  @IsOptional()
  @IsBooleanString()
  read?: string;
}

export class RegisterPushTokenDto {
  @ApiProperty({ maxLength: 300, description: 'Token do dispositivo (modo simulado: identificador local)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  token: string;

  @ApiPropertyOptional({ enum: ['android', 'ios', 'web'] })
  @IsOptional()
  @IsIn(['android', 'ios', 'web'])
  platform?: string;
}
