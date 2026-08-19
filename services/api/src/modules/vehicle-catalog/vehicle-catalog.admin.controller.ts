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
import { VehicleCatalogService } from './vehicle-catalog.service';
import {
  CreateVehicleBrandDto,
  CreateVehicleCatalogModelDto,
  CreateVehicleCatalogYearDto,
  ListVehicleCatalogModelsQueryDto,
  ListVehicleCatalogYearsQueryDto,
  UpdateVehicleBrandDto,
  UpdateVehicleCatalogModelDto,
  UpdateVehicleCatalogYearDto,
} from './dto/vehicle-catalog.dto';

@ApiTags('admin/vehicle-catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/vehicle-catalog')
export class AdminVehicleCatalogController {
  constructor(private readonly vehicleCatalogService: VehicleCatalogService) {}

  // ── Marcas ────────────────────────────────────────────────────────
  @Post('brands')
  @ApiOperation({ summary: 'Cria uma marca de veiculo' })
  createBrand(@Body() dto: CreateVehicleBrandDto) {
    return this.vehicleCatalogService.createBrand(dto);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Lista todas as marcas (ativas e inativas)' })
  listBrands() {
    return this.vehicleCatalogService.listAllBrands();
  }

  @Patch('brands/:id')
  @ApiOperation({ summary: 'Atualiza uma marca de veiculo' })
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleBrandDto) {
    return this.vehicleCatalogService.updateBrand(id, dto);
  }

  @Delete('brands/:id')
  @ApiOperation({ summary: 'Remove uma marca de veiculo (bloqueado se em uso)' })
  removeBrand(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleCatalogService.removeBrand(id);
  }

  // ── Modelos ───────────────────────────────────────────────────────
  @Post('models')
  @ApiOperation({ summary: 'Cria um modelo de veiculo' })
  createModel(@Body() dto: CreateVehicleCatalogModelDto) {
    return this.vehicleCatalogService.createModel(dto);
  }

  @Get('models')
  @ApiOperation({ summary: 'Lista todos os modelos, opcionalmente filtrados por marca' })
  listModels(@Query() query: ListVehicleCatalogModelsQueryDto) {
    return this.vehicleCatalogService.listAllModels(query.brandId);
  }

  @Patch('models/:id')
  @ApiOperation({ summary: 'Atualiza um modelo de veiculo' })
  updateModel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleCatalogModelDto) {
    return this.vehicleCatalogService.updateModel(id, dto);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Remove um modelo de veiculo (bloqueado se em uso)' })
  removeModel(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleCatalogService.removeModel(id);
  }

  // ── Anos ──────────────────────────────────────────────────────────
  @Post('years')
  @ApiOperation({ summary: 'Cria um ano de modelo de veiculo' })
  createYear(@Body() dto: CreateVehicleCatalogYearDto) {
    return this.vehicleCatalogService.createYear(dto);
  }

  @Get('years')
  @ApiOperation({ summary: 'Lista todos os anos, opcionalmente filtrados por modelo' })
  listYears(@Query() query: ListVehicleCatalogYearsQueryDto) {
    return this.vehicleCatalogService.listAllYears(query.modelId);
  }

  @Patch('years/:id')
  @ApiOperation({ summary: 'Atualiza um ano de modelo de veiculo' })
  updateYear(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleCatalogYearDto) {
    return this.vehicleCatalogService.updateYear(id, dto);
  }

  @Delete('years/:id')
  @ApiOperation({ summary: 'Remove um ano de modelo de veiculo (bloqueado se em uso)' })
  removeYear(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehicleCatalogService.removeYear(id);
  }
}
