import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZonesService } from './zones.service';
import { CreateZoneDto, ListZonesQueryDto, UpdateZoneDto } from './dto/zones.dto';

@ApiTags('admin/zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/zones')
export class AdminZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma zona de cobertura' })
  createZone(@Body() dto: CreateZoneDto) {
    return this.zonesService.createZone(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista zonas de cobertura com filtros' })
  listZones(@Query() query: ListZonesQueryDto) {
    return this.zonesService.listZones(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma zona de cobertura' })
  getZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZoneById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma zona de cobertura' })
  updateZone(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.updateZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa uma zona de cobertura' })
  deactivateZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.deactivateZone(id);
  }
}
