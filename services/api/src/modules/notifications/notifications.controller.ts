import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
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
import { ListNotificationsQueryDto } from './dto/notifications.dto';

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
}
