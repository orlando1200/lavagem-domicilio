import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductOrderDeliveryStatus } from '@prisma/client';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

/** Lavador avanca o status da propria entrega (ON_THE_WAY -> DELIVERED). */
export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: ProductOrderDeliveryStatus })
  @IsEnum(ProductOrderDeliveryStatus)
  status!: ProductOrderDeliveryStatus;
}

export class ListDeliveriesDto extends CursorPaginationDto {
  @ApiPropertyOptional({ enum: ProductOrderDeliveryStatus })
  @IsOptional()
  @IsEnum(ProductOrderDeliveryStatus)
  status?: ProductOrderDeliveryStatus;
}

class AdminCreateDeliveryItemDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

/**
 * Criacao de entrega pelo admin, para simular/testar o fluxo de
 * "Entregas Loja do Lavador" sem depender do fluxo completo de checkout
 * do marketplace. Cria um ProductOrder (status comercial `pending`) ja
 * com `deliveryStatus = PENDING`, disponivel para aceite por lavadores.
 */
export class AdminCreateDeliveryDto {
  @ApiProperty({ description: 'Usuario (lavador) que comprou o produto' })
  @IsUUID()
  buyerUserId!: string;

  @ApiPropertyOptional({ description: 'Perfil de lavador do comprador, se aplicavel' })
  @IsOptional()
  @IsUUID()
  buyerWasherId?: string;

  @ApiProperty({ description: 'Loja do Lavador de origem' })
  @IsUUID()
  storeId!: string;

  @ApiPropertyOptional({ description: 'Taxa de entrega (frete) em reais', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingAmount?: number;

  @ApiProperty({ type: [AdminCreateDeliveryItemDto] })
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdminCreateDeliveryItemDto)
  items!: AdminCreateDeliveryItemDto[];
}
