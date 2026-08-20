import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WashPricingService } from './wash-pricing.service';
import { CreateWashPriceDto, UpdateWashPriceDto } from './dto/wash-pricing.dto';

@ApiTags('admin/wash-pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/wash-pricing')
export class AdminWashPricingController {
  constructor(private readonly washPricingService: WashPricingService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um preco pra uma combinacao tamanho x tipo de lavagem' })
  create(@Body() dto: CreateWashPriceDto) {
    return this.washPricingService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista toda a matriz de precos (ativa e inativa)' })
  listAll() {
    return this.washPricingService.listAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza preco/status de uma combinacao' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWashPriceDto) {
    return this.washPricingService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma combinacao da matriz' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.washPricingService.remove(id);
  }
}
