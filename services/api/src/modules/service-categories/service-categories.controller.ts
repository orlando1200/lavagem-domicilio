import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('service-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('service-categories')
export class ServiceCategoriesController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista as categorias de servico ativas com preco real (DRY_WASH/EXPRESS_WASH) — ' +
      'HEAVY_SERVICE nao tem preco fixo e continua indo a leilao',
  })
  listActive() {
    return this.serviceCategoriesService.listActive();
  }
}
