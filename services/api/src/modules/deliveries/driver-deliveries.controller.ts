import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { DeliveriesService } from './deliveries.service';
import { ListDeliveriesDto, UpdateDeliveryStatusDto } from './dto/deliveries.dto';

/**
 * Entregas de produtos da Loja do Lavador (insumos, repostos, equipamentos)
 * feitas pelo proprio lavador, funcionando como entregador. Distinto do
 * fluxo de pedidos de lavagem (`/orders`).
 */
@ApiTags('driver/deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR)
@Controller('driver/deliveries')
export class DriverDeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista entregas disponiveis/pendentes para lavadores' })
  listAvailable(@Query() query: ListDeliveriesDto) {
    return this.deliveriesService.listAvailableDeliveries(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Entrega ativa do lavador autenticado' })
  getActive(@CurrentUser() user: AuthenticatedUser) {
    return this.deliveriesService.getActiveDelivery(user.id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Lavador aceita uma entrega disponivel' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveriesService.acceptDelivery(user.id, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Avanca o status da entrega atribuida ao lavador' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveriesService.updateDeliveryStatus(user.id, id, dto);
  }
}
