import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MapsService } from './maps.service';
import { GetDistanceQueryDto } from './dto/maps.dto';

@ApiTags('maps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('distance')
  @ApiOperation({
    summary: 'Distancia e duracao estimada entre dois pontos (Google Maps ou calculo local) + taxa de entrega',
  })
  async getDistance(@Query() query: GetDistanceQueryDto) {
    const result = await this.mapsService.getDistance(
      { lat: query.originLat, lng: query.originLng },
      { lat: query.destLat, lng: query.destLng },
    );

    return {
      ...result,
      deliveryFee: this.mapsService.calculateDeliveryFee(result.distanceKm),
    };
  }
}
