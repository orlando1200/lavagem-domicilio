import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { DriverStatus, DispatchStatus, OnlineStatus, OrderStatus, VerificationStatus } from '@prisma/client';

@Injectable()
export class DriversService {






















































































































    });
  }

  async rejectOrder(orderId: string, driverUserId: string) {
    const attempt = await this.prisma.dispatchAttempt.findFirst({
      where: {
        orderId,
        driverUserId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!attempt) {
      // Idempotent: no pending attempt means already rejected or not assigned
      return { ok: true };
    }

    await this.prisma.dispatchAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async updateOrderStatus(orderId: string, driverUserId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.driverUserId !== driverUserId) {




























































      this.prisma.driverProfile.count({ where }),
    ]);

    return { data: items, total, page: filters.page, limit: filters.limit };
  }

  async getDriverById(id: string) {


















      this.prisma.driverProfile.count({ where }),
    ]);

    return { data: items, total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) };
  }

  async getDriverById(id: string) {
