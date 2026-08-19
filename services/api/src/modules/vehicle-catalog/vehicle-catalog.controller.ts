import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VehicleCatalogService } from './vehicle-catalog.service';
import { ListVehicleCatalogModelsQueryDto, ListVehicleCatalogYearsQueryDto } from './dto/vehicle-catalog.dto';

@ApiTags('vehicle-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicle-catalog')
export class VehicleCatalogController {
  constructor(private readonly vehicleCatalogService: VehicleCatalogService) {}

  @Get('brands')
  @ApiOperation({ summary: 'Lista marcas ativas do catalogo de veiculos' })
  listBrands() {
    return this.vehicleCatalogService.listActiveBrands();
  }

  @Get('models')
  @ApiOperation({ summary: 'Lista modelos ativos, opcionalmente filtrados por marca' })
  listModels(@Query() query: ListVehicleCatalogModelsQueryDto) {
    return this.vehicleCatalogService.listActiveModels(query.brandId);
  }

  @Get('years')
  @ApiOperation({ summary: 'Lista anos ativos, opcionalmente filtrados por modelo' })
  listYears(@Query() query: ListVehicleCatalogYearsQueryDto) {
    return this.vehicleCatalogService.listActiveYears(query.modelId);
  }
}
