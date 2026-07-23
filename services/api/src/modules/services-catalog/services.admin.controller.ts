import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ServicesCatalogService } from './services-catalog.service';
import {
  CreateServiceDto,
  CreateServiceVehicleRuleDto,
  ListServicesQueryDto,
  UpdateServiceDto,
  UpdateServiceVehicleRuleDto,
} from './dto/services-catalog.dto';

@ApiTags('admin/services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List services (admin, paginated)' })
  async listServices(
    @Query() query: ListServicesQueryDto,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.servicesCatalogService.listServicesAdmin(
      query.categoryId,
      Number(page),
      Number(limit),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create service' })
  createService(@Body() dto: CreateServiceDto) {
    return this.servicesCatalogService.createService(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service details' })
  getService(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesCatalogService.getService(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesCatalogService.updateService(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  deleteService(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesCatalogService.deleteService(id);
  }

  @Post(':id/vehicle-rules')
  @ApiOperation({ summary: 'Create vehicle rule for a service' })
  createVehicleRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceVehicleRuleDto,
  ) {
    return this.servicesCatalogService.createVehicleRule(id, dto);
  }

  @Patch(':id/prices/:size')
  @ApiOperation({ summary: 'Update or create price for a vehicle size tier' })
  async updatePriceBySize(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('size') size: string,
    @Body('price') price: number,
  ) {
    return this.servicesCatalogService.upsertVehicleRulePrice(id, size, price);
  }
}

@ApiTags('admin/service-vehicle-rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/service-vehicle-rules')
export class AdminServiceVehicleRulesController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle rule' })
  updateVehicleRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceVehicleRuleDto,
  ) {
    return this.servicesCatalogService.updateVehicleRule(id, dto);
  }
}

    })),
  };
}

function mapVehicleSize(sizeTier?: string): string {
  const map: Record<string, string> = {
    pequeno: 'small',
    hatch: 'small',
    moto: 'small',
    medio: 'medium',
    sedan: 'medium',
    large: 'large',
    suv: 'suv',
    pickup: 'truck',
    caminhonete: 'truck',
    van: 'truck',
    utility: 'truck',
  };
  return map[sizeTier ?? ''] || 'medium';
}

@ApiTags('admin/service-vehicle-rules')
@ApiBearerAuth()
