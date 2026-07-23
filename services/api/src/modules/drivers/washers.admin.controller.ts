import {
  Controller,
  Get,
  Param,
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
import { DriversService } from '../drivers/drivers.service';

@ApiTags('admin/washers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/washers')
export class AdminWashersController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'List all washers' })
  listWashers(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.driversService.listDrivers({
      status,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get washer details' })
  getWasher(@Param('id', ParseUUIDPipe) id: string) {
    return this.driversService.getDriverById(id);
  }
}

