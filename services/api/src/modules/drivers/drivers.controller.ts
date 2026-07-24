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
import { DriversService } from './drivers.service';
import {
  CreateWasherProfileDto,
  UpdateWasherAvailabilityDto,
  UpdateWasherProfileDto,
} from './dto/washers.dto';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR)
@Controller('drivers/me')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @ApiOperation({ summary: 'Cria o perfil de lavador (onboarding) para o usuario autenticado' })
  createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWasherProfileDto,
  ) {
    return this.driversService.createProfile(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtem o perfil de lavador do usuario autenticado' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.driversService.getMyProfile(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Atualiza o perfil de lavador do usuario autenticado' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWasherProfileDto,
  ) {
    return this.driversService.updateMyProfile(user.id, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Define disponibilidade do lavador para novos pedidos' })
  updateAvailability(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWasherAvailabilityDto,
  ) {
    return this.driversService.updateMyAvailability(user.id, dto);
  }
}
