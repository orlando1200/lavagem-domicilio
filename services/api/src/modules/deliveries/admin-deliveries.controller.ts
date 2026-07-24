import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeliveriesService } from './deliveries.service';
import { AdminCreateDeliveryDto, ListDeliveriesDto } from './dto/deliveries.dto';

@ApiTags('admin/deliveries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/deliveries')
export class AdminDeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma entrega de produto da Loja do Lavador (simulacao/teste)' })
  create(@Body() dto: AdminCreateDeliveryDto) {
    return this.deliveriesService.createDeliveryAsAdmin(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as entregas com filtros' })
  list(@Query() query: ListDeliveriesDto) {
    return this.deliveriesService.listAllDeliveriesAsAdmin(query);
  }
}
