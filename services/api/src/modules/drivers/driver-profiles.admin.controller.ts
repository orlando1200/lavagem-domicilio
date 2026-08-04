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
import { DriverProfilesService } from './driver-profiles.service';
import {
  AdminUpdateDriverProfileStatusDto,
  ListDriverProfilesQueryDto,
} from './dto/driver-profiles.dto';

@ApiTags('admin/driver-profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/driver-profiles')
export class AdminDriverProfilesController {
  constructor(private readonly driverProfilesService: DriverProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista perfis de motorista/loja com filtros de status, tipo e busca' })
  listProfiles(@Query() query: ListDriverProfilesQueryDto) {
    return this.driverProfilesService.listProfiles(query);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Detalhes de um perfil de motorista/loja' })
  getProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.driverProfilesService.getProfileById(userId);
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Atualiza o status de um perfil de motorista/loja (aprovar, bloquear, etc.)' })
  updateStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateDriverProfileStatusDto,
  ) {
    return this.driverProfilesService.updateStatusAsAdmin(userId, dto);
  }
}
