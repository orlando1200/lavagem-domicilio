import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RentalService } from './rental.service';

@ApiTags('rentals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR)
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @Post('me/request')
  @ApiOperation({
    summary:
      'Lavador solicita um aluguel de moto (autoservico). Nasce com ' +
      'status requested e weeklyRate = 0 ate o admin aprovar e ' +
      'confirmar o valor.',
  })
  requestRental(@CurrentUser() user: AuthenticatedUser) {
    return this.rentalService.requestRental(user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Locacao de moto atual (ou mais recente) do lavador logado' })
  getMyRental(@CurrentUser() user: AuthenticatedUser) {
    return this.rentalService.getMyRental(user.id);
  }
}
