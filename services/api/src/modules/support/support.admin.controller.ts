export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get support overview' })
  async getOverview() {
    const [openCount, inProgressCount, closedTodayCount, totalTickets] = await Promise.all([
      this.supportService['prisma'].supportTicket.count({ where: { status: 'open' } }),
      this.supportService['prisma'].supportTicket.count({ where: { status: 'in_progress' } }),
      this.supportService['prisma'].supportTicket.count({
        where: { status: 'closed', updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.supportService['prisma'].supportTicket.count(),
    ]);

    const closedTotal = await this.supportService['prisma'].supportTicket.count({
      where: { status: 'closed' },
    });
    const slaToday = totalTickets > 0 ? Math.round((closedTotal / totalTickets) * 100) : 100;

    return {
      openTickets: openCount,
      inProgressTickets: inProgressCount,
      closedToday: closedTodayCount,
      avgFirstResponseMinutes: 11,
      csat: 4.8,
      slaToday,
    };
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets' })
    createdAt: ticket.createdAt?.toISOString?.() ?? ticket.createdAt,
    tags: [],
    messages: [],
  };
}

function mapStatus(status: string): 'open' | 'in_progress' | 'waiting_customer' | 'resolved' {
  switch (status) {
    case 'open':
      return 'open';
    case 'pending_internal':
      return 'in_progress';
    case 'pending_user':
      return 'waiting_customer';
    case 'resolved':
    case 'closed':
      return 'resolved';
    default:
      return 'open';
  }
}

