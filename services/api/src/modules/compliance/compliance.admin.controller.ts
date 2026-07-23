import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole, DriverStatus, DocumentStatus } from '@prisma/client';
import { ComplianceService } from './compliance.service';
import { UpdateOnboardingStatusDto } from './dto/compliance.dto';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

class ListOnboardingsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

class ReviewDocumentDto {
  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('admin/compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/compliance')
export class AdminComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('onboardings')
  @ApiOperation({ summary: 'List driver onboardings with filters' })
  async listOnboardings(@Query() query: ListOnboardingsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.complianceService.listPendingReview(page, limit);

    let data = result.data;
    if (query.status) {
      data = data.filter((d) => d.status === query.status);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      data = data.filter(
        (d) =>
          d.user.email.toLowerCase().includes(term) ||
          d.user.profile?.fullName?.toLowerCase().includes(term),
      );
    }

    return {
      data,
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit),
    };
  }

  @Get('onboardings/:id')
  @ApiOperation({ summary: 'Get onboarding details' })
  getOnboarding(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.adminGetDriver(id);
  }

  @Post('onboardings/:id/approve')
  @ApiOperation({ summary: 'Approve driver onboarding' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.adminUpdateDriverStatus(id, DriverStatus.active);
  }

  @Post('onboardings/:id/reject')
  @ApiOperation({ summary: 'Reject driver onboarding' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOnboardingStatusDto,
  ) {
    return this.complianceService.adminUpdateDriverStatus(id, DriverStatus.rejected, dto.reason);
  }

  @Patch('onboardings/:onboardingId/documents/:documentId')
  @ApiOperation({ summary: 'Review a document' })
  reviewDocument(
    @Param('onboardingId', ParseUUIDPipe) onboardingId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: ReviewDocumentDto,
  ) {
    // Document review is handled by updating the document status directly
    return this.complianceService['prisma'].driverDocument.update({
      where: { id: documentId, driverUserId: onboardingId },
      data: {
        status: dto.status,
        ...(dto.reason ? { rejectionReason: dto.reason } : {}),
      },
    });
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get compliance metrics' })
  async getMetrics() {
    const [pending, underReview, approved, rejected, total] = await Promise.all([
      this.complianceService['prisma'].driverProfile.count({
        where: { status: DriverStatus.submitted },
      }),
      this.complianceService['prisma'].driverProfile.count({
        where: { status: DriverStatus.under_review },
      }),
      this.complianceService['prisma'].driverProfile.count({
        where: { status: DriverStatus.active },
      }),
      this.complianceService['prisma'].driverProfile.count({
        where: { status: DriverStatus.rejected },
      }),
      this.complianceService['prisma'].driverProfile.count(),
    ]);

    return {
      pending,
      underReview,
      approved,
      rejected,
      total,
      approvalRate: total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0,
    };
  }
}

