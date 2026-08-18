import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsOptional } from 'class-validator';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Filtra por lidas (true) ou nao lidas (false)' })
  @IsOptional()
  @IsBooleanString()
  read?: string;
}
