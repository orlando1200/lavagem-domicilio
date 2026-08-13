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
import { SupportService } from './support.service';
import { ListSupportTicketsQueryDto, UpdateSupportTicketStatusDto } from './dto/support.dto';

@ApiTags('admin/support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'Lista tickets de suporte com filtros' })
  listTickets(@Query() query: ListSupportTicketsQueryDto) {
    return this.supportService.listTicketsForAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um ticket de suporte' })
  getTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.getTicketByIdForAdmin(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualiza o status de um ticket de suporte' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportTicketStatusDto,
  ) {
    return this.supportService.updateStatusAsAdmin(id, dto);
  }
}
