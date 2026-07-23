export class AdminDashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  async getMetrics(@Query() query: FinancialReportQueryDto) {
    return this.analyticsService.getDashboardMetrics(query);
  }

  @Get('operational')
  @ApiOperation({ summary: 'Get operational dashboard data' })
  async getOperational() {
    return this.analyticsService.getOperationalDashboard();
  }
}

