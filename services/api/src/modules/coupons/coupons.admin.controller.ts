import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CouponsService } from './coupons.service';
import {
  CreateCouponCampaignDto,
  CreateCouponDto,
  ListCouponsQueryDto,
  UpdateCouponCampaignDto,
  UpdateCouponDto,
} from './dto/coupons.dto';

@ApiTags('admin/coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('campaigns')
  @ApiOperation({ summary: 'Cria uma campanha de cupons' })
  createCampaign(@Body() dto: CreateCouponCampaignDto) {
    return this.couponsService.createCampaign(dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Lista campanhas de cupons' })
  listCampaigns() {
    return this.couponsService.listCampaigns();
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Atualiza uma campanha de cupons' })
  updateCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponCampaignDto,
  ) {
    return this.couponsService.updateCampaign(id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um cupom' })
  createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista cupons com filtros' })
  listCoupons(@Query() query: ListCouponsQueryDto) {
    return this.couponsService.listCoupons(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um cupom' })
  getCoupon(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.getCouponById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um cupom' })
  updateCoupon(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativa um cupom' })
  deleteCoupon(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
