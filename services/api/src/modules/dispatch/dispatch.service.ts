import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { haversineDistanceKm } from '@common/utils/geo.util';
import { DriverNotificationsGateway } from './driver-notifications.gateway';
import { DispatchStatus, DriverStatus, OnlineStatus, OrderStatus } from '@prisma/client';

interface DriverCandidate {
  userId: string;
  latitude: number;
  longitude: number;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  score: number;
}

const OFFER_TIMEOUT_MS = 60_000; // 60 seconds per driver
const SPEED_KMH = 30; // assumed average speed for ETA

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly driverGateway: DriverNotificationsGateway,
  ) {}

  /**
   * Score = (1 / distanceKm) * 0.6 + (rating / 5) * 0.4






































































































        `Offering order ${orderId} to driver ${best.userId} (score=${best.score.toFixed(2)}, dist=${best.distanceKm.toFixed(2)}km)`,
      );

      const attempt = await this.prisma.dispatchAttempt.create({
        data: {
          orderId,
          driverUserId: best.userId,
          score: best.score,
          distanceKm: best.distanceKm,
          etaMinutes: best.etaMinutes,
          status: DispatchStatus.offered,
        },
      });

      // Emit real-time offer to driver
      this.driverGateway.emitOffer(best.userId, {
        attemptId: attempt.id,
        orderId,
        distanceKm: best.distanceKm,
        etaMinutes: best.etaMinutes,
        score: best.score,
        expiresAt: new Date(Date.now() + OFFER_TIMEOUT_MS).toISOString(),
      });

      // Wait for driver response (polling with timeout)
      const accepted = await this.waitForResponse(attempt.id, OFFER_TIMEOUT_MS);
