@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/compliance')
export class AdminComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('drivers/pending-review')
  @ApiOperation({ summary: 'List drivers pending review (submitted or under_review)' })
  @ApiResponse({ status: 200, description: 'Pending drivers listed' })
  async listPendingReview(@Query() query: ListPendingDriversDto) {
    return this.complianceService.listPendingReview(
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('drivers/:driverUserId')
  @ApiOperation({ summary: 'Get full driver compliance profile' })
  @ApiParam({ name: 'driverUserId', type: String })
  @ApiResponse({ status: 200, description: 'Driver compliance profile' })
  async getDriver(@Param('driverUserId', ParseUUIDPipe) driverUserId: string) {
    return this.complianceService.adminGetDriver(driverUserId);
  }

  @Put('drivers/:driverUserId/review/start')
  @ApiOperation({ summary: 'Move driver status submitted → under_review' })
  @ApiParam({ name: 'driverUserId', type: String })
  @ApiResponse({ status: 200, description: 'Review started' })
  async startReview(@Param('driverUserId', ParseUUIDPipe) driverUserId: string) {
    return this.complianceService.adminStartReview(driverUserId);
  }

  @Put('drivers/:driverUserId/status')
  @ApiOperation({ summary: 'Update driver onboarding status (approve / reject / suspend)' })
  @ApiParam({ name: 'driverUserId', type: String })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('driverUserId', ParseUUIDPipe) driverUserId: string,
    @Body() dto: UpdateOnboardingStatusDto,
  ) {
    return this.complianceService.adminUpdateDriverStatus(
      driverUserId,
      dto.status,
      dto.reason,
    );
  }
}

