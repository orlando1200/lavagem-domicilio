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
import { ZonesService } from './zones.service';
import {
  CreateZoneDto,
  CreateZonePricingRuleDto,
  ListZonesQueryDto,
  UpdateZoneDto,
  UpdateZonePricingRuleDto,
} from './dto/zones.dto';

@ApiTags('admin/zones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/zones')
export class AdminZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'List zones' })
  listZones(@Query() query: ListZonesQueryDto) {
    return this.zonesService.listZones(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by id' })
  getZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZone(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create zone' })
  createZone(@Body() dto: CreateZoneDto) {
    return this.zonesService.createZone(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update zone' })
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.updateZone(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete zone' })
  deleteZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.deleteZone(id);
  }

  @Get(':id/pricing-rules')
  @ApiOperation({ summary: 'List zone pricing rules' })
  getPricingRules(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getZonePricingRules(id);
  }

  @Post(':id/pricing-rules')
  @ApiOperation({ summary: 'Create zone pricing rule' })
  createPricingRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateZonePricingRuleDto,
  ) {
    return this.zonesService.createPricingRule(id, dto);
  }

  @Patch('pricing-rules/:ruleId')
  @ApiOperation({ summary: 'Update zone pricing rule' })
  updatePricingRule(
    @Param('ruleId', ParseUUIDPipe) ruleId: string,
    @Body() dto: UpdateZonePricingRuleDto,
  ) {
    return this.zonesService.updatePricingRule(ruleId, dto);
  }
}

