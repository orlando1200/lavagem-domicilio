import {
  Body,
  Controller,
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
import { PayoutsService } from './payouts.service';
import {
  GenerateStorePayoutDto,
  GenerateWasherPayoutDto,
  ListPayoutsQueryDto,
  UpdatePayoutStatusDto,
} from './dto/payouts.dto';

@ApiTags('admin/payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('washers')
  @ApiOperation({ summary: 'Apura e gera repasse de um lavador para um periodo' })
  generateWasherPayout(@Body() dto: GenerateWasherPayoutDto) {
    return this.payoutsService.generateWasherPayout(dto);
  }

  @Post('stores')
  @ApiOperation({ summary: 'Apura e gera repasse de uma loja para um periodo' })
  generateStorePayout(@Body() dto: GenerateStorePayoutDto) {
    return this.payoutsService.generateStorePayout(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista repasses com filtros' })
  listPayouts(@Query() query: ListPayoutsQueryDto) {
    return this.payoutsService.listPayouts(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um repasse' })
  getPayout(@Param('id', ParseUUIDPipe) id: string) {
    return this.payoutsService.getPayoutById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualiza o status de um repasse (aprovar, pagar, rejeitar)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayoutStatusDto,
  ) {
    return this.payoutsService.updatePayoutStatus(id, dto);
  }
}
