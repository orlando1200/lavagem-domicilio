import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { DriverProfilesService } from './driver-profiles.service';
import {
  CreateDriverProfileDto,
  UpdateDriverProfileAvailabilityDto,
  UpdateDriverProfileDto,
} from './dto/driver-profiles.dto';

@ApiTags('driver-profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR)
@Controller('driver-profiles/me')
export class DriverProfilesController {
  constructor(private readonly driverProfilesService: DriverProfilesService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria o perfil de motorista/loja (moto, carro ou carwash shop) para o usuario autenticado',
  })
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDriverProfileDto,
  ) {
    return this.driverProfilesService.createProfile(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtem o perfil de motorista/loja do usuario autenticado' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.driverProfilesService.getMyProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza o perfil de motorista/loja do usuario autenticado' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.driverProfilesService.updateMyProfile(user.id, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Define disponibilidade do motorista/loja para novos pedidos/leiloes' })
  updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDriverProfileAvailabilityDto,
  ) {
    return this.driverProfilesService.updateMyAvailability(user.id, dto);
  }
}
