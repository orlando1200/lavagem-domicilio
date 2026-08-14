import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { LogisticsPlan } from '@prisma/client';

export class UpdateLogisticsPlanDto {
  @ApiProperty({ enum: LogisticsPlan })
  @IsEnum(LogisticsPlan)
  logisticsPlan!: LogisticsPlan;
}
