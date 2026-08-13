import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';
import { AdminListPaymentsQueryDto, AdminPaymentsReportQueryDto } from './dto/payments.dto';

@ApiTags('admin/payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista pagamentos com filtros (relatorio financeiro)' })
  listPayments(@Query() query: AdminListPaymentsQueryDto) {
    return this.paymentsService.listPaymentsAsAdmin(query);
  }

  @Get('report')
  @ApiOperation({ summary: 'Resumo agregado de pagamentos (total, por status, por metodo)' })
  getReport(@Query() query: AdminPaymentsReportQueryDto) {
    return this.paymentsService.getPaymentsReportAsAdmin(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporta pagamentos filtrados (ate 5000 linhas, sem paginacao)' })
  exportPayments(@Query() query: AdminPaymentsReportQueryDto) {
    return this.paymentsService.exportPaymentsAsAdmin(query);
  }
}
