import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '@common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/chat.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto, ListOrdersDto } from './dto/list-orders.dto';
import { UserRole } from '@prisma/client';











































    return this.ordersService.cancel(id, user.userId, user.role, dto);
  }

  @Get(':id/history')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Get status history of an order' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getStatusHistory(id);
  }

  @Get(':id/chat')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Get chat messages for an order' })
  getChatMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.getChatMessages(id, user.userId, user.role);
  }

  @Post(':id/chat')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Send chat message in an order' })
  sendChatMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.ordersService.sendChatMessage(id, user.userId, dto.message);
  }
}

