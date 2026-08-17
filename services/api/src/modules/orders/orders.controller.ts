import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { CancelOrderDto, UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cliente cria um novo pedido de lavagem' })
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get()
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lista os pedidos do cliente autenticado' })
  listMyOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersDto,
  ) {
    return this.ordersService.listMyOrders(user.id, query);
  }

  @Get('available')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lavador lista pedidos disponiveis para aceitar (searching_washer, na sua zona)' })
  listAvailableOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listAvailableOrdersForDriver(user.id);
  }

  @Get('mine/active')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lavador consulta seu pedido ativo (aceito, a caminho ou em andamento)' })
  getMyActiveOrder(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getMyActiveOrder(user.id);
  }

  @Get(':id')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Acompanha um pedido especifico do cliente' })
  getMyOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getMyOrderById(user.id, id);
  }

  @Get(':id/driver-location')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Posicao atual do lavador atribuido (tracking, polling) — null ' +
      'se nao ha lavador, pedido fora de etapa rastreavel, ou sem ' +
      'posicao reportada ainda',
  })
  getDriverLocation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getDriverLocationForOrder(user.id, id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLIENTE, UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cliente ou lavador atribuido cancela um pedido' })
  cancelOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(user, id, dto);
  }

  @Patch(':id/accept')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lavador aceita um pedido disponivel' })
  acceptOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.acceptOrder(user.id, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lavador atualiza o status do pedido atribuido a ele' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatusAsDriver(user.id, id, dto);
  }
}
