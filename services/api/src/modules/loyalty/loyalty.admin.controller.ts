import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { UserRole } from '@prisma/client';
import { LoyaltyService } from './loyalty.service';
import {
  CreateLoyaltyCampaignDto,
  ListLoyaltyCampaignsDto,
  UpdateLoyaltyCampaignDto,
} from './dto/loyalty-campaign.dto';

@ApiTags('admin/loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/loyalty')
export class AdminLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get loyalty overview' })
  async getOverview() {
    const [activeCampaigns, totalActiveUsers, totalPointsIssued, totalPointsRedeemed] =
      await Promise.all([
        this.loyaltyService['prisma'].loyaltyCampaign.count({
          where: { status: 'active' },
        }),
        this.loyaltyService['prisma'].clientProfile.count({
          where: { loyaltyPoints: { gt: 0 } },
        }),
        this.loyaltyService['prisma'].clientProfile.aggregate({ _sum: { loyaltyPoints: true } }),
        this.loyaltyService['prisma'].couponRedemption.count(),
      ]);

    const pointsIssued = Number(totalPointsIssued._sum.loyaltyPoints ?? 0);
    const pointsRedeemed = totalPointsRedeemed * 100;
    const redemptionRate = pointsIssued > 0 ? (pointsRedeemed / pointsIssued) * 100 : 0;

    return {
      activeMembers: totalActiveUsers,
      pointsIssued,
      pointsRedeemed,
      redemptionRate: Number(redemptionRate.toFixed(2)),
      activeCampaigns,
      tiers: [
        { name: 'bronze', minPoints: 0, color: '#cd7f32' },
        { name: 'silver', minPoints: 250, color: '#c0c0c0' },
        { name: 'gold', minPoints: 700, color: '#ffd700' },
        { name: 'diamond', minPoints: 1500, color: '#b9f2ff' },
      ],
    };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List loyalty campaigns' })
  listCampaigns(@Query() query: ListLoyaltyCampaignsDto) {
    return this.loyaltyService.listCampaigns(query);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create loyalty campaign' })
  createCampaign(@Body() dto: CreateLoyaltyCampaignDto) {
    return this.loyaltyService.createCampaign(dto);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update loyalty campaign' })
  updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoyaltyCampaignDto,
  ) {
    return this.loyaltyService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete loyalty campaign' })
  deleteCampaign(@Param('id', ParseUUIDPipe) id: string) {
    return this.loyaltyService.deleteCampaign(id);
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List loyalty tiers' })
  listTiers() {
    return [
      { id: 'bronze', name: 'Bronze', minPoints: 0, multiplier: 1 },
      { id: 'silver', name: 'Silver', minPoints: 250, multiplier: 1.1 },
      { id: 'gold', name: 'Gold', minPoints: 700, multiplier: 1.25 },
      { id: 'diamond', name: 'Diamond', minPoints: 1500, multiplier: 1.5 },
    ];
  }
}

