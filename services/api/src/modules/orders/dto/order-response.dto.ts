import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, ServiceType } from '@prisma/client';

/**
 * Formato de resposta serializado para pedidos, usado tanto pelos
 * endpoints do cliente quanto pelos endpoints admin. Nao substitui a
 * validacao de entrada (DTOs de request) — apenas documenta o shape de
 * saida no Swagger.
 */
export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty({ required: false, nullable: true })
  driverId?: string | null;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  addressId: string;

  @ApiProperty({ required: false, nullable: true })
  zoneId?: string | null;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: ServiceType, required: false, nullable: true })
  serviceType?: ServiceType | null;

  @ApiProperty({ required: false, nullable: true })
  scheduledAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  startedAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  completedAt?: Date | null;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ required: false, nullable: true })
  notes?: string | null;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
