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
import { UserRole, CouponStatus, DiscountType } from '@prisma/client';
import { CouponsService } from '../coupons/coupons.service';
import { ListCouponsDto } from '../coupons/dto/coupons.dto';

class CreateCouponAdminDto {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

class UpdateCouponAdminDto extends CreateCouponAdminDto {}

@ApiTags('admin/coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @ApiOperation({ summary: 'List coupons' })
  async findAll(@Query() query: ListCouponsDto) {
    const result = await this.couponsService.findAll(query);
    return {
      ...result,
      data: result.data.map(toCouponResponse),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create coupon' })
  async create(@Body() dto: CreateCouponAdminDto) {
    const coupon = await this.couponsService.create(toBackendCreateDto(dto));
    return toCouponResponse(coupon);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponAdminDto,
  ) {
    const coupon = await this.couponsService.update(id, toBackendCreateDto(dto));
    return toCouponResponse(coupon);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete coupon' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.remove(id);
  }
}

function toBackendCreateDto(dto: CreateCouponAdminDto) {
  return {
    code: dto.code,
    name: dto.name,
    description: dto.description,
    discountType: dto.type === 'percentage' ? DiscountType.percent : DiscountType.fixed,
    discountValue: dto.value,
    maxDiscountAmount: undefined,
    minOrderAmount: dto.minOrderValue,
    usageLimit: dto.maxUses,
    usageLimitPerUser: dto.maxUsesPerUser,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    isActive: dto.isActive ?? true,
  };
}

function toCouponResponse(coupon: any) {
  const status = coupon.isActive
    ? new Date(coupon.endsAt) < new Date()
      ? CouponStatus.expired
      : CouponStatus.active
    : CouponStatus.inactive;

  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.discountType === DiscountType.percent ? 'percentage' : 'fixed',
    value: Number(coupon.discountValue),
    minOrderValue: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : undefined,
    maxUses: coupon.usageLimit ?? undefined,
    usedCount: coupon._count?.redemptions ?? 0,
    status,
    expiresAt: coupon.endsAt,
    createdAt: coupon.createdAt,
  };
}







    };
  }

  @Post()
  @ApiOperation({ summary: 'Create coupon' })
  async create(@Body() dto: CreateCouponAdminDto) {
    const backendDto = toBackendCreateDto(dto);
    return toCouponResponse(coupon);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update coupon' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponAdminDto,
  ) {
    const backendDto = toBackendUpdateDto(dto);
    const coupon = await this.couponsService.update(id, backendDto);
    return toCouponResponse(coupon);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete coupon' })



  }
}

function toBackendCreateDto(dto: CreateCouponAdminDto) {
  if (!dto) return dto;
  return {
    code: dto.code,
    name: dto.name,
    description: dto.description,
    discountType: dto.type === 'percentage' ? DiscountType.percent : DiscountType.fixed,
    discountValue: dto.value,
    maxDiscountAmount: undefined,
    minOrderAmount: dto.minOrderValue,
    usageLimit: dto.maxUses,
    usageLimitPerUser: dto.maxUsesPerUser,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt,
    isActive: dto.isActive ?? true,
  };
}

function toCouponResponse(coupon: any) {
  const status = coupon.isActive
