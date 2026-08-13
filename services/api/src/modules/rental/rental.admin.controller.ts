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
import { RentalService } from './rental.service';
import {
  AssignRentalDriverDto,
  CreateRentalDto,
  ListRentalsQueryDto,
  UpdateRentalStatusDto,
} from './dto/rental.dto';

@ApiTags('admin/rentals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/rentals')
export class AdminRentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma locacao de moto para um lavador' })
  createRental(@Body() dto: CreateRentalDto) {
    return this.rentalService.createRental(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista locacoes de moto com filtros' })
  listRentals(@Query() query: ListRentalsQueryDto) {
    return this.rentalService.listRentals(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma locacao de moto' })
  getRental(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalService.getRentalById(id);
  }

  @Patch(':id/assign-driver')
  @ApiOperation({ summary: 'Atribui um lavador a uma locacao de moto' })
  assignDriver(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRentalDriverDto) {
    return this.rentalService.assignDriverAsAdmin(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Forca a atualizacao do status de uma locacao de moto' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRentalStatusDto) {
    return this.rentalService.updateStatusAsAdmin(id, dto);
  }
}
