import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateDriverLocationDto {
  @IsUUID()
  driverUserId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speedKmh?: number;
}

