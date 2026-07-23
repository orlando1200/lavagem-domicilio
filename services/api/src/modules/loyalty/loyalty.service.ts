import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import {
  CreateLoyaltyCampaignDto,
  ListLoyaltyCampaignsDto,
  UpdateLoyaltyCampaignDto,
} from './dto/loyalty-campaign.dto';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async listCampaigns(query: ListLoyaltyCampaignsDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.loyaltyCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyCampaign.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createCampaign(dto: CreateLoyaltyCampaignDto) {
    return this.prisma.loyaltyCampaign.create({
      data: {
        name: dto.name,
        description: dto.description,
        rewardType: dto.rewardType,
        pointsCost: dto.pointsCost,
        rewardValue: dto.rewardValue,
        status: dto.status ?? 'draft',
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async updateCampaign(id: string, dto: UpdateLoyaltyCampaignDto) {
    const campaign = await this.prisma.loyaltyCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    return this.prisma.loyaltyCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.rewardType !== undefined ? { rewardType: dto.rewardType } : {}),
        ...(dto.pointsCost !== undefined ? { pointsCost: dto.pointsCost } : {}),
        ...(dto.rewardValue !== undefined ? { rewardValue: dto.rewardValue } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null } : {}),
      },
    });
  }

  async deleteCampaign(id: string) {
    const campaign = await this.prisma.loyaltyCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.prisma.loyaltyCampaign.delete({ where: { id } });
  }

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { clientProfile: true },
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? new Date(dto.startsAt) : null } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ? new Date(dto.endsAt) : null } : {}),
      },
    });
    return {
      ...updated,
      expiresAt: updated.endsAt?.toISOString?.() ?? updated.endsAt,
      rewardValue: Number(updated.rewardValue),
    };
  }

  async deleteCampaign(id: string) {
    const campaign = await this.prisma.loyaltyCampaign.findUnique({ where: { id } });
