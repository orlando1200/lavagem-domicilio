import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class GetDistanceQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  originLat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  originLng: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  destLat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  destLng: number;
}
