import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,

@ApiTags('services')
@Controller()

import { RolesGuard } from '@common/guards/roles.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ServicesCatalogService } from './services-catalog.service';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  ListServicesQueryDto,
} from './dto/services-catalog.dto';

@ApiTags('services')
@Controller()


    return this.servicesCatalogService.listServices(query.categoryId);
  }

  @Get('services/:id')
  @ApiOperation({ summary: 'Get service details' })
  @ApiResponse({ status: 200, description: 'Service returned successfully' })
  getService(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.servicesCatalogService.getService(id);
  }
}







    return this.servicesCatalogService.createCategory(dto);
  }

  @Patch('admin/services/categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service category (admin)' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.servicesCatalogService.updateCategory(id, dto);
  }
}


