import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from './dto/service-categories.dto';

@ApiTags('admin/service-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/service-categories')
export class AdminServiceCategoriesController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma categoria de servico (DRY_WASH ou EXPRESS_WASH)' })
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.serviceCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as categorias de servico (ativas e inativas)' })
  listAll() {
    return this.serviceCategoriesService.listAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma categoria de servico' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.serviceCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma categoria de servico' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceCategoriesService.remove(id);
  }
}
