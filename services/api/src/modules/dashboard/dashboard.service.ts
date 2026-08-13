import { Injectable } from '@nestjs/common';
import { DriverStatus, PaymentStatus, StoreStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resumo real do painel, sem nenhuma metrica inventada. Nao inclui
   * "comissao GIUCAR" pra lavagem — Order nao tem take-rate (isso so
   * existe em ProductOrder/marketplace via CommissionPlan).
   */
  async getSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      ordersByStatus,
      paidTotalAgg,
      paidTodayAgg,
      activeDrivers,
      activeStores,
      newClientsToday,
      pendingDriverApprovals,
    ] = await Promise.all([
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.paid },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.paid, createdAt: { gte: todayStart } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.driverProfile.count({ where: { status: DriverStatus.active } }),
      this.prisma.store.count({ where: { status: StoreStatus.active } }),
      this.prisma.user.count({
        where: { role: UserRole.CLIENTE, createdAt: { gte: todayStart } },
      }),
      this.prisma.driverProfile.count({ where: { status: DriverStatus.pending_documents } }),
    ]);

    return {
      ordersByStatus: ordersByStatus.map((g) => ({ status: g.status, count: g._count._all })),
      revenue: {
        totalPaidAmount: paidTotalAgg._sum.amount ?? 0,
        totalPaidCount: paidTotalAgg._count._all,
        todayPaidAmount: paidTodayAgg._sum.amount ?? 0,
        todayPaidCount: paidTodayAgg._count._all,
      },
      activeDrivers,
      activeStores,
      newClientsToday,
      pendingDriverApprovals,
    };
  }
}
