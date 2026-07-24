import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { AdminAssignWasherDto, AdminListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('admin/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os pedidos com filtros' })
  listOrders(@Query() query: AdminListOrdersDto) {
    return this.ordersService.listAllOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um pedido' })
  getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderByIdAsAdmin(id);
  }

  @Patch(':id/assign-washer')
  @ApiOperation({ summary: 'Atribui manualmente um lavador ao pedido' })
  assignWasher(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminAssignWasherDto,
  ) {
    return this.ordersService.assignWasherAsAdmin(id, dto.washerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Forca a atualizacao do status do pedido' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatusAsAdmin(id, dto);
  }
}
