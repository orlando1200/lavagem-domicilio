import {
  Controller,
  Get,
  Patch,
  Param,
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
import { UserRole } from '@prisma/client';
import { PayoutsService } from '../payouts/payouts.service';
import { ListPayoutsDto, AdminApprovePayoutDto } from '../payouts/dto/payouts.dto';

@ApiTags('admin/repayments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/repayments')
export class AdminRepaymentsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  @ApiOperation({ summary: 'List all repayments/payouts' })
  async findAll(@Query() query: ListPayoutsDto) {
    const result = await this.payoutsService.listAllPayouts(query);
    return {
      ...result,
      data: result.data.map(toRepaymentResponse),
    };
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve repayment' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminApprovePayoutDto,
  ) {
    const payout = await this.payoutsService.approvePayout(id, dto);
    return toRepaymentResponse(payout);
  }

  @Patch(':id/paid')
  @ApiOperation({ summary: 'Mark repayment as paid' })
  async paid(@Param('id', ParseUUIDPipe) id: string) {
    const payout = await this.payoutsService.approvePayout(id, { providerReference: 'manual' });
    return toRepaymentResponse(payout);
  }
}

function toRepaymentResponse(payout: any) {
  const driver = payout.driver;
  const user = driver?.user;

  return {
    id: payout.id,
    washerId: payout.driverUserId,
    washer: user
      ? {
          id: user.id,
          user: {
            id: user.id,
            fullName: user.profile?.fullName ?? user.email,
            email: user.email,
            phone: user.profile?.phone ?? '',
          },
          status: driver.status,
          rating: Number(driver.rating ?? 0),
        }
      : undefined,
    period: payout.periodStart
      ? `${new Date(payout.periodStart).toLocaleDateString('pt-BR')} - ${new Date(payout.periodEnd).toLocaleDateString('pt-BR')}`
      : 'N/A',
    ordersCount: Number(payout.ordersCount ?? 0),
    grossAmount: Number(payout.grossAmount),
    commission: Number(payout.feeAmount ?? 0),
    netAmount: Number(payout.netAmount),
    status: payout.status,
    approvedAt: payout.approvedAt?.toISOString(),
    paidAt: payout.paidAt?.toISOString(),
    createdAt: payout.createdAt?.toISOString(),
  };
}

