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
import { UserRole, RentalOfferStatus } from '@prisma/client';
import { RentalService } from '../rental/rental.service';
import {
  CreateRentalPartnerDto,
  UpdateRentalPartnerDto,
  ListRentalPartnersDto,
  CreateRentalOfferDto,
  UpdateRentalOfferDto,
  ListRentalOffersDto,
} from '../rental/dto/rental.dto';

@ApiTags('admin/moto-rental')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/moto-rental')
export class AdminMotoRentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Get('partners')
  @ApiOperation({ summary: 'List rental partners' })
  async listPartners(@Query() query: ListRentalPartnersDto) {
    const result = await this.rentalService.listPartners(query);
    return {
      ...result,
      data: result.data.map(toPartnerResponse),
    };
  }

  @Post('partners')
  @ApiOperation({ summary: 'Create rental partner' })
  async createPartner(@Body() dto: CreateRentalPartnerDto) {
    const partner = await this.rentalService.createPartner(dto);
    return toPartnerResponse(partner);
  }

  @Patch('partners/:id')
  @ApiOperation({ summary: 'Update rental partner' })
  async updatePartner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRentalPartnerDto,
  ) {
    const partner = await this.rentalService.updatePartner(id, dto);
    return toPartnerResponse(partner);
  }
    return this.rentalService.removePartner(id);
  }

  @Get('partners/:id/offers')
  @ApiOperation({ summary: 'List offers for a partner (unpaged array)' })
  async listPartnerOffers(@Param('id', ParseUUIDPipe) partnerId: string) {
    const result = await this.rentalService.listOffers({ partnerId, limit: 1000 } as any);
    return result.data;
  }

  @Post('partners/:id/offers')
  @ApiOperation({ summary: 'Create offer for a partner' })
  }

  @Post('partners/:id/offers')
  @ApiOperation({ summary: 'Create offer for a partner' })
  async createOffer(
    @Param('id', ParseUUIDPipe) partnerId: string,
    @Body() dto: CreateRentalOfferDto,
  ) {
    const offer = await this.rentalService.createOffer({ ...dto, partnerId });
    return toOfferResponse(offer);
  }

  @Get('offers')
  @ApiOperation({ summary: 'List all rental offers' })
  async listOffers(@Query() query: ListRentalOffersDto) {
    const result = await this.rentalService.listOffers(query);
    return {
      ...result,
      data: result.data.map(toOfferResponse),
    };
  }

  @Patch('offers/:id')
  @ApiOperation({ summary: 'Update rental offer' })
  async updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRentalOfferDto,
    return this.rentalService.removeOffer(id);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get rental metrics' })
  async getMetrics() {
    const [partners, activePartners, offers, availableOffers, dailyOffers, weeklyOffers, monthlyOffers, leads] =
      await Promise.all([
        this.rentalService['prisma'].rentalPartner.count(),
        this.rentalService['prisma'].rentalPartner.count({ where: { status: 'active' } }),
        this.rentalService['prisma'].rentalOffer.count(),
        this.rentalService['prisma'].rentalOffer.count({ where: { status: 'available' } }),
        this.rentalService['prisma'].rentalOffer.count({ where: { pricePeriod: 'daily' } }),
        this.rentalService['prisma'].rentalOffer.count({ where: { pricePeriod: 'weekly' } }),
        this.rentalService['prisma'].rentalOffer.count({ where: { pricePeriod: 'monthly' } }),
        this.rentalService['prisma'].rentalLead.count(),
      ]);

    return {
      totalPartners: partners,
      activePartners,
      totalOffers: offers,
      availableOffers,
      dailyOffers,
      weeklyOffers,
      monthlyOffers,
      totalLeads: leads,
    };
  }
}

      dailyOffers,
      weeklyOffers,
      monthlyOffers,
      totalLeads: leads,
    };
  }
}

function toPartnerResponse(partner: any) {
  return {
    id: partner.id,
    name: partner.name,
    email: partner.email,
    phone: partner.phone,
    address: partner.address,
    city: partner.city,
    state: partner.state,
    document: partner.document,
    status: partner.status,
    offersCount: partner._count?.offers ?? 0,
    offers: partner.offers?.map(toOfferResponse),
    createdAt: partner.createdAt?.toISOString?.() ?? partner.createdAt,
    updatedAt: partner.updatedAt?.toISOString?.() ?? partner.updatedAt,
  };
}

function toOfferResponse(offer: any) {
  const periodMap: Record<string, string> = {
    day: 'daily',
    week: 'weekly',
    month: 'monthly',
  };

  return {
    id: offer.id,
    partnerId: offer.partnerId,
    model: offer.vehicleType ?? offer.title,
    year: offer.year ?? new Date().getFullYear(),
    type: periodMap[offer.pricePeriod] ?? offer.pricePeriod,
    price: Number(offer.priceAmount),
    available: offer.status === RentalOfferStatus.active,
    description: offer.description,
    createdAt: offer.createdAt?.toISOString?.() ?? offer.createdAt,
  };
}

      weekly: 'week',
      monthly: 'month',
    };
    if (dto.type) backendDto.pricePeriod = periodMap[dto.type];

    const offer = await this.rentalService.updateOffer(id, backendDto);
    return toOfferResponse(offer);
  }

  @Delete('offers/:id')
  @ApiOperation({ summary: 'Deactivate rental offer' })










  }
}

function toBackendOfferDto(dto: CreateRentalOfferAdminDto, partnerId: string) {
  const periodMap: Record<string, string> = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month',
  };

  return {
    partnerId,
    title: dto.model,
    description: dto.description ?? `${dto.model} ${dto.year}`,
    vehicleType: dto.model,
    city: dto.city ?? 'São Paulo',
    state: dto.state ?? 'SP',
    pricePeriod: periodMap[dto.type] as any,
    priceAmount: dto.price,
    status: dto.available !== false ? RentalOfferStatus.active : RentalOfferStatus.inactive,
  };
}

function toPartnerResponse(partner: any) {
  return {
    id: partner.id,
    name: partner.name,
