import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({ description: 'Pedido (Order) para o qual o leilao sera aberto' })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Ids dos servicos pesados solicitados (catalogo)',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  serviceIds: string[];

  @ApiPropertyOptional({ description: 'Orcamento maximo que o cliente aceita pagar' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBudget?: number;

  @ApiPropertyOptional({ description: 'Prazo, em horas, para recebimento de pujas' })
  @IsOptional()
  @IsInt()
  @Min(1)
  deadlineHours?: number;
}
