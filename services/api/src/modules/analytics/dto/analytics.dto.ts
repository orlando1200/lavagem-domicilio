  cancellationRate: number;

  @ApiProperty({ type: [String] })
  topPaymentMethods: string[];
}

export class OperationalTrainingProgressDto {
  @ApiProperty()
  completed: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  overdue: number;

  @ApiProperty()
  certificationRate: number;
}

export class OperationalBotOverviewDto {
  @ApiProperty()
  conversationsToday: number;

  @ApiProperty()
  conversionRate: number;

  @ApiProperty()
  avgResponseSeconds: number;

  @ApiProperty()
  recoveredOrders: number;
}

export class OperationalRecurringOverviewDto {
  @ApiProperty()
  activeSubscriptions: number;

  @ApiProperty()
  renewalsThisWeek: number;

  @ApiProperty()
  churnRiskCount: number;

  @ApiProperty()
  projectedRevenue: number;
}

export class OperationalDemandZoneDto {
  @ApiProperty()
  zone: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  demandScore: number;

  @ApiProperty()
  predictedOrders: number;

  @ApiProperty()
  activeWashers: number;

  @ApiProperty()
  avgEtaMinutes: number;

  @ApiProperty()
  surgeMultiplier: number;

  @ApiProperty()
  trend: string;
}

export class OperationalRouteSuggestionDto {
  @ApiProperty()
  zone: string;

  @ApiProperty()
  stops: number;

  @ApiProperty()
  estimatedKm: number;

  @ApiProperty()
  estimatedMinutes: number;

  @ApiProperty()
  fuelSavingPercent: number;
}

export class OperationalDashboardMetricsDto {
  @ApiProperty()
  aiSurgeEnabled: boolean;

  @ApiProperty()
  surgeFloor: number;

  @ApiProperty()
  surgeCap: number;

  @ApiProperty()
  avgSurgeMultiplier: number;

  @ApiProperty()
  predictedDemandGrowth: number;

  @ApiProperty()
  hotZones: number;

  @ApiProperty()
  routeEfficiencyGain: number;

  @ApiProperty({ type: OperationalTrainingProgressDto })
  trainingProgress: OperationalTrainingProgressDto;

  @ApiProperty({ type: OperationalBotOverviewDto })
  botOverview: OperationalBotOverviewDto;

  @ApiProperty({ type: OperationalRecurringOverviewDto })
  recurringOverview: OperationalRecurringOverviewDto;

  @ApiProperty({ type: [OperationalDemandZoneDto] })
  demandZones: OperationalDemandZoneDto[];

  @ApiProperty({ type: [OperationalRouteSuggestionDto] })
  routeSuggestions: OperationalRouteSuggestionDto[];
}

export class TransactionsReportQueryDto extends FinancialReportQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  @ApiProperty({ type: [OperationalDemandTimelinePointDto] })
  demandTimeline: OperationalDemandTimelinePointDto[];

  @ApiProperty({ type: [OperationalDemandZoneDto] })
  demandZones: OperationalDemandZoneDto[];

  @ApiProperty({ type: [OperationalRouteSuggestionDto] })
  routeSuggestions: OperationalRouteSuggestionDto[];
}

export class TransactionsReportQueryDto extends FinancialReportQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
