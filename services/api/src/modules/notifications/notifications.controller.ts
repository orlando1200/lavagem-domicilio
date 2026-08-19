import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationsQueryDto, RegisterPushTokenDto } from './dto/notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENTE, UserRole.LAVADOR)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lista as notificacoes do usuario autenticado' })
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: ListNotificationsQueryDto) {
    return this.notificationsService.listMine(user.id, query);
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Conta as notificacoes nao lidas do usuario autenticado' })
  countUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.countUnread(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca uma notificacao como lida' })
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('me/read-all')
  @ApiOperation({ summary: 'Marca todas as notificacoes do usuario autenticado como lidas' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('push-token')
  @ApiOperation({
    summary:
      'Registra o token de push do dispositivo atual (modo simulado — sem envio real ainda)',
  })
  registerPushToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterPushTokenDto) {
    return this.notificationsService.registerPushToken(user.id, dto.token, dto.platform);
  }

  @Delete('push-token/:token')
  @ApiOperation({ summary: 'Remove o token de push do dispositivo atual (ex.: no logout)' })
  unregisterPushToken(@CurrentUser() user: AuthenticatedUser, @Param('token') token: string) {
    return this.notificationsService.unregisterPushToken(user.id, token);
  }
}
