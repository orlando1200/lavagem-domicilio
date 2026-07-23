import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  AnalyticsOverviewResponseDto,
  DemandHeatmapQueryDto,
  DemandHeatmapResponseDto,
  AnalyticsPeriod,
  FinancialReportQueryDto,
  FinancialReportResponseDto,
  TransactionsReportQueryDto,
  TransactionsReportResponseDto,
  OperationalDashboardMetricsDto,
} from './dto/analytics.dto';

type DateRange = {
  startDate: Date;




export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(query: FinancialReportQueryDto) {
    const range = this.resolveDateRange(query);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [ordersInRange, ordersToday, usersCount, driversCount, activeDriversCount] =
      await Promise.all([
        this.prisma.order.findMany({
          where: {
            createdAt: { gte: range.startDate, lte: range.endDate },
          },
          select: {
            status: true,
            totalAmount: true,
            paymentStatus: true,
            createdAt: true,
            items: { select: { serviceName: true, totalPrice: true } },
          },
        }),
        this.prisma.order.findMany({
          where: { createdAt: { gte: startOfToday, lte: endOfToday } },
          select: { status: true, totalAmount: true, paymentStatus: true },
        }),
        this.prisma.user.count({ where: { role: 'client' } }),
        this.prisma.driverProfile.count(),
        this.prisma.driverProfile.count({ where: { availableNow: true } }),
      ]);

    const paidOrders = ordersInRange.filter((o) => o.paymentStatus === PaymentStatus.paid);
    const totalRevenue = this.sum(paidOrders.map((o) => Number(o.totalAmount)));
    const totalOrders = ordersInRange.length;
    const completedOrders = ordersInRange.filter((o) => o.status === OrderStatus.completed).length;
    const cancelledOrders = ordersInRange.filter((o) => o.status === OrderStatus.cancelled).length;
    const pendingOrders = ordersInRange.filter(
      (o) => ![OrderStatus.completed, OrderStatus.cancelled].includes(o.status),
    ).length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const paidToday = ordersToday.filter((o) => o.paymentStatus === PaymentStatus.paid);
    const revenueToday = this.sum(paidToday.map((o) => Number(o.totalAmount)));
    const completedOrdersToday = ordersToday.filter((o) => o.status === OrderStatus.completed).length;
    const ordersTodayCount = ordersToday.length;

    // Build last 7 days charts
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const revenueChart = last7Days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayOrders = paidOrders.filter(
        (o) => new Date(o.createdAt) >= day && new Date(o.createdAt) < nextDay,
      );
      return {
        date: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue: this.sum(dayOrders.map((o) => Number(o.totalAmount))),
      };
    });

    const ordersChart = last7Days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayOrders = ordersInRange.filter(
        (o) => new Date(o.createdAt) >= day && new Date(o.createdAt) < nextDay,
      );
      return {
        date: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        count: dayOrders.length,
      };
    });

    const statusChart = [
      { status: 'Pendentes', count: pendingOrders },
      { status: 'Concluídos', count: completedOrders },
      { status: 'Cancelados', count: cancelledOrders },
    ];

    const serviceMap = new Map<string, { orders: number; revenue: number }>();
    for (const order of paidOrders) {
      for (const item of order.items) {
        const entry = serviceMap.get(item.serviceName) ?? { orders: 0, revenue: 0 };
        entry.orders += 1;
        entry.revenue += Number(item.totalPrice);
        serviceMap.set(item.serviceName, entry);
      }
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([name, values]) => ({ name, orders: values.orders, revenue: this.round(values.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalOrders,
      ordersToday: ordersTodayCount,
      totalRevenue: this.round(totalRevenue),
      revenueToday: this.round(revenueToday),
      totalUsers: usersCount,
      totalWashers: driversCount,
      activeWashers: activeDriversCount,
      pendingOrders,
      completedOrdersToday,
      completionRate: this.round(completionRate),
      averageTicket: this.round(averageTicket),
      averageRating: 4.7,
      conversionRate: 18.4,
      activeUsersToday: usersCount,
      revenueChart,
      ordersChart,
      statusChart,
      topServices,
    };
  }

  async getFinancialReport(query: FinancialReportQueryDto): Promise<FinancialReportResponseDto> {
    const range = this.resolveDateRange(query);
    const orders = await this.prisma.order.findMany({
      where: {
        this.prisma.driverProfile.count({ where: { availableNow: true } }),
        this.prisma.order.count({
          where: {
            status: { in: [OrderStatus.pending, OrderStatus.driver_assigned, OrderStatus.in_progress] },
          },
        }),
        this.prisma.order.count({ where: { isRecurring: true, status: { not: OrderStatus.cancelled } } }),
        this.prisma.supportTicket.count({ where: { channel: 'whatsapp' } }),
        this.prisma.order.count({ where: { source: 'bot' } }),
        this.prisma.driverProfile.count(),
        this.prisma.driverProfile.count({ where: { onboardingStatus: 'completed' } }),
        this.prisma.driverProfile.count({
          where: { onboardingStatus: { in: ['pending_documents', 'awaiting_kit', 'active'] } },
        }),
      ]);

    const zones = await this.prisma.coverageZone.findMany({
      where: { isActive: true },
      take: 4,
      include: { _count: { select: { activeOrders: true } } },
    });

    const demandZones = zones.map((zone) => ({
      zone: zone.name,
      city: zone.city,
      demandScore: Math.min(100, Math.max(0, zone.demandScore ?? 50)),
      predictedOrders: zone._count.activeOrders + Math.floor(Math.random() * 10),
      activeWashers: Math.floor(Math.random() * activeWashers),
      avgEtaMinutes: Math.floor(10 + Math.random() * 15),
      surgeMultiplier: Number((1 + (zone.demandScore ?? 50) / 200).toFixed(2)),
      trend: (zone.demandScore ?? 50) > 60 ? 'up' : (zone.demandScore ?? 50) < 40 ? 'down' : 'stable',
    }));

    return {
      aiSurgeEnabled: true,
      surgeFloor: 1.0,
      surgeCap: 1.8,
      avgSurgeMultiplier: 1.24,
      predictedDemandGrowth: 18.6,
      hotZones: demandZones.filter((z) => z.demandScore >= 75).length,
      routeEfficiencyGain: 22,
      trainingProgress: {
        completed: completedTraining,
        inProgress: inProgressTraining,
        overdue: Math.max(0, totalDrivers - completedTraining - inProgressTraining),
        certificationRate: totalDrivers > 0 ? (completedTraining / totalDrivers) * 100 : 0,
      },
      botOverview: {
        conversationsToday: totalConversations,
        conversionRate: 31.4,
        avgResponseSeconds: 18,
        recoveredOrders: botOrders,
      },
      recurringOverview: {
        activeSubscriptions,
        renewalsThisWeek: Math.floor(activeSubscriptions * 0.2),
        churnRiskCount: 11,
        projectedRevenue: activeSubscriptions * 155,
      },
      demandTimeline: [
        { window: 'Agora', demand: 72, capacity: activeWashers },
        { window: '+2h', demand: 88, capacity: activeWashers + 3 },
        { window: '+4h', demand: 94, capacity: activeWashers + 6 },
        { window: '+8h', demand: 76, capacity: activeWashers + 8 },
      ],
      demandZones,
      routeSuggestions: demandZones.map((zone) => ({
        zone: zone.zone,
        stops: Math.floor(3 + Math.random() * 4),
        estimatedKm: Number((10 + Math.random() * 15).toFixed(1)),
        estimatedMinutes: Math.floor(40 + Math.random() * 40),
        fuelSavingPercent: Math.floor(14 + Math.random() * 12),
      })),
    };
  }

  async getFinancialReport(query: FinancialReportQueryDto): Promise<FinancialReportResponseDto> {
    const range = this.resolveDateRange(query);
        activeSubscriptions,
        renewalsThisWeek: Math.floor(activeSubscriptions * 0.2),
        churnRiskCount: 11,
        projectedRevenue: activeSubscriptions * 155,
      },
      demandTimeline: [
        { window: 'Agora', demand: 72, capacity: activeWashers },
        { window: '+2h', demand: 88, capacity: activeWashers + 3 },
        { window: '+4h', demand: 94, capacity: activeWashers + 6 },
        { window: '+8h', demand: 76, capacity: activeWashers + 8 },
      ],
      demandZones,
      routeSuggestions: demandZones.map((zone) => ({
        zone: zone.zone,
        stops: Math.floor(3 + ((idx) => idx % 5)(zones.indexOf(zones.find((z) => z.name === zone.zone)!)) + 1),
        estimatedKm: Number((10 + ((idx) => idx * 3)(zones.indexOf(zones.find((z) => z.name === zone.zone)!))).toFixed(1)),
        estimatedMinutes: Math.floor(40 + ((idx) => idx * 7)(zones.indexOf(zones.find((z) => z.name === zone.zone)!))),
        fuelSavingPercent: Math.floor(14 + ((idx) => idx * 2)(zones.indexOf(zones.find((z) => z.name === zone.zone)!))),
      })),
    };
  }

  async getFinancialReport(query: FinancialReportQueryDto): Promise<FinancialReportResponseDto> {
    const range = this.resolveDateRange(query);
      ],
      demandZones,
      routeSuggestions,
    };
  }

  async getFinancialReport(query: FinancialReportQueryDto): Promise<FinancialReportResponseDto> {
