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
import { DriversService } from './drivers.service';
import { AdminUpdateWasherStatusDto, ListWashersQueryDto } from './dto/washers.dto';

@ApiTags('admin/washers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/washers')
export class AdminWashersController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'Lista lavadores com filtros de status e busca' })
  listWashers(@Query() query: ListWashersQueryDto) {
    return this.driversService.listWashers(query);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Detalhes do perfil de um lavador' })
  getWasher(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.driversService.getWasherById(userId);
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Atualiza o status de um lavador (aprovar, bloquear, etc.)' })
  updateStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateWasherStatusDto,
  ) {
    return this.driversService.updateWasherStatusAsAdmin(userId, dto);
  }
}
