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
import { ServicesCatalogService } from '../services-catalog/services-catalog.service';
import {
  CreateServiceCategoryDto,
  ListCategoriesQueryDto,
  UpdateServiceCategoryDto,
} from '../services-catalog/dto/services-catalog.dto';

@ApiTags('admin/categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories' })
    return this.servicesCatalogService.listCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  getCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesCatalogService.getCategory(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateServiceCategoryDto) {
    return this.servicesCatalogService.createCategory(dto);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  async getCategory(@Param('id', ParseUUIDPipe) id: string) {
    const category = await this.servicesCatalogService.getCategory(id);
    return {
      ...category,
      servicesCount: category._count?.services ?? 0,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  createCategory(@Body() dto: CreateServiceCategoryDto) {
    return this.servicesCatalogService.createCategory(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.servicesCatalogService.updateCategory(id, dto);
  }
}

  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesCatalogService.deleteCategory(id);
  }
}

