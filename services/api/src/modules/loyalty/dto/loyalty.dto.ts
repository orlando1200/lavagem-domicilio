import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RedeemLoyaltyPointsDto {
  @ApiProperty({ description: 'Pedido no qual o desconto sera aplicado' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Quantidade de pontos a resgatar', minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;
}

export class ListLoyaltyHistoryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
