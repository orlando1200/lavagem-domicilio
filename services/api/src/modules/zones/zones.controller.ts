import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';

@ApiTags('zones')
@Controller()
  ApiTags,
} from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { ListZonesQueryDto } from './dto/zones.dto';
  constructor(private readonly zonesService: ZonesService) {}

  @Get('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get('zones')
  @ApiOperation({ summary: 'List active coverage zones' })





  UpdateZonePricingRuleDto,
} from './dto/zones.dto';

@ApiTags('zones')
@Controller()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get('zones')
  @ApiOperation({ summary: 'List active coverage zones' })
  @ApiResponse({ status: 200, description: 'Zones listed successfully' })
  listZones(@Query() query: ListZonesQueryDto) {
    return this.zonesService.listZones(query);
  }

  @Get('zones/:id')
  @ApiOperation({ summary: 'Get coverage zone details' })
  @ApiResponse({ status: 200, description: 'Zone returned successfully' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  getZone(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.getZone(id);
  }
}
