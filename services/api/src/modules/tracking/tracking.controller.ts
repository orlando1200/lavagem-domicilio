import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TrackingService } from './tracking.service';
import { UpdateDriverLocationDto } from './dto/tracking.dto';

@ApiTags('tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('orders/:orderId/location')
  @Roles(UserRole.driver)
  @ApiOperation({ summary: 'Driver updates location for an active order' })
  @ApiParam({ name: 'orderId', type: String })
  async updateLocation(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateDriverLocationDto,
  ) {
    return this.trackingService.handleLocationUpdate({
      orderId,
      driverUserId: dto.driverUserId,
      lat: dto.lat,
      lng: dto.lng,
      heading: dto.heading,
      speedKmh: dto.speedKmh,
    });
  }

  @Get('orders/:orderId/location')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Get latest driver location for an order' })
  @ApiParam({ name: 'orderId', type: String })
  async getOrderLocation(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const order = await this.trackingService['prisma'].order.findUnique({
      where: { id: orderId },
      select: { driverUserId: true },
    });

    if (!order?.driverUserId) {
      return null;
    }

    return this.trackingService.getLatestDriverLocation(order.driverUserId);
  }

  @Get('drivers/:driverUserId/location')
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Admin gets latest driver location' })
  @ApiParam({ name: 'driverUserId', type: String })
  async getDriverLocation(
    @Param('driverUserId', ParseUUIDPipe) driverUserId: string,
  ) {
    return this.trackingService.getLatestDriverLocation(driverUserId);
  }

  @Get('orders/:orderId/eta')
  @Roles(UserRole.client, UserRole.driver, UserRole.admin)
  @ApiOperation({ summary: 'Compute ETA to destination address' })
  @ApiParam({ name: 'orderId', type: String })
  async getEta(@Param('orderId', ParseUUIDPipe) orderId: string) {
    const order = await this.trackingService['prisma'].order.findUnique({
      where: { id: orderId },
      include: {
        serviceAddress: { select: { latitude: true, longitude: true } },
      },
    });

    if (!order?.driverUserId || !order.serviceAddress?.latitude) {
      return { etaMinutes: null };
    }

    const eta = await this.trackingService.computeEta(
      order.driverUserId,
      Number(order.serviceAddress.latitude),
      Number(order.serviceAddress.longitude),
    );

    return { etaMinutes: eta };
  }
}

