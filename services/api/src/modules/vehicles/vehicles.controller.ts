import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, LookupPlateParamsDto } from './dto/vehicles.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENTE)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um veiculo para o cliente autenticado' })
  createVehicle(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(user.id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lista os veiculos do cliente autenticado' })
  listMyVehicles(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.listMyVehicles(user.id);
  }

  @Get('lookup-plate/:plate')
  @ApiOperation({
    summary:
      'Consulta marca/modelo/ano/cor por placa (modo simulado — ver PlateLookupGateway). ' +
      'Retorna 200 com os dados ou 404 quando a placa nao e encontrada.',
  })
  lookupPlate(@Param() params: LookupPlateParamsDto) {
    return this.vehiclesService.lookupPlate(params.plate);
  }
}
