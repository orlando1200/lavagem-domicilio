import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WashPricingService } from './wash-pricing.service';

@ApiTags('wash-pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wash-pricing')
export class WashPricingController {
  constructor(private readonly washPricingService: WashPricingService) {}

  @Get('matrix')
  @ApiOperation({
    summary:
      'Lista a matriz de precos ativa (tamanho x tipo de lavagem) — Servicos Auto / Lavagem',
  })
  listActive() {
    return this.washPricingService.listActive();
  }
}
