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
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CreateBidDto, UpdateBidDto } from './dto/create-bid.dto';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import {
  ListAuctionsDto,
  ListAvailableAuctionsDto,
  ListMyBidsDto,
} from './dto/list-auctions.dto';

@ApiTags('auctions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  // ── CLIENTE ──────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cliente abre um leilao de servico pesado para um pedido pendente' })
  createAuction(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAuctionDto) {
    return this.auctionsService.createAuction(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lista os leiloes do cliente autenticado' })
  listMyAuctions(@CurrentUser() user: AuthenticatedUser, @Query() query: ListAuctionsDto) {
    return this.auctionsService.listMyAuctions(user.id, query);
  }

  @Get('me/:id')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Detalhes de um leilao do cliente, com pujas rankeadas' })
  getMyAuction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.auctionsService.getMyAuction(user.id, id);
  }

  @Patch('me/:id/cancel')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cliente cancela um leilao aberto' })
  cancelMyAuction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAuctionDto,
  ) {
    return this.auctionsService.cancelMyAuction(user.id, id, dto);
  }

  @Patch('me/:id/bids/:bidId/accept')
  @Roles(UserRole.CLIENTE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Cliente aceita a puja vencedora, fechando o leilao' })
  acceptBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bidId', ParseUUIDPipe) bidId: string,
  ) {
    return this.auctionsService.acceptBid(user.id, id, bidId);
  }

  // ── LOJA / OFICINA (LAVADOR com perfil CARWASH_SHOP) ────────────────

  @Get('available')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lista leiloes abertos disponiveis para a loja autenticada pujar' })
  listAvailableAuctions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAvailableAuctionsDto,
  ) {
    return this.auctionsService.listAvailableAuctions(user.id, query);
  }

  @Get('bids/me')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Lista as pujas enviadas pela loja autenticada' })
  listMyBids(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMyBidsDto) {
    return this.auctionsService.listMyBids(user.id, query);
  }

  @Post(':id/bids')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Loja envia uma puja para um leilao aberto' })
  createBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBidDto,
  ) {
    return this.auctionsService.createBid(user.id, id, dto);
  }

  @Patch(':id/bids/me')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Loja atualiza a propria puja pendente' })
  updateMyBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBidDto,
  ) {
    return this.auctionsService.updateMyBid(user.id, id, dto);
  }

  @Delete(':id/bids/me')
  @Roles(UserRole.LAVADOR)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Loja retira a propria puja pendente' })
  withdrawMyBid(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.auctionsService.withdrawMyBid(user.id, id);
  }
}
