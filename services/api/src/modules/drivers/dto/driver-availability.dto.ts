import { IsBoolean } from 'class-validator';

export class DriverAvailabilityDto {
  @IsBoolean()
  availableNow: boolean;
}

