import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuctionsService } from './auctions.service';
import { AdminListAuctionsDto } from './dto/list-auctions.dto';
import { CancelAuctionDto } from './dto/cancel-auction.dto';

@ApiTags('admin/auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/auctions')
export class AdminAuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os leiloes com filtros' })
  listAuctions(@Query() query: AdminListAuctionsDto) {
    return this.auctionsService.listAllAuctionsAsAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um leilao, com pujas rankeadas' })
  getAuction(@Param('id', ParseUUIDPipe) id: string) {
    return this.auctionsService.getAuctionByIdAsAdmin(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela forcadamente um leilao aberto' })
  cancelAuction(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelAuctionDto) {
    return this.auctionsService.cancelAuctionAsAdmin(id, dto);
  }

  @Post('expire-overdue')
  @ApiOperation({
    summary: 'Marca como expirados os leiloes abertos com prazo vencido (chamado por cron externo)',
  })
  expireOverdue() {
    return this.auctionsService.expireOverdueAuctions();
  }
}
