import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { DocumentVerificationService } from './document-verification.service';
import {
  ListDocumentVerificationsQueryDto,
  ReviewDocumentVerificationDto,
} from './dto/document-verification.dto';

@ApiTags('admin/document-verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/document-verification')
export class AdminDocumentVerificationController {
  constructor(private readonly documentVerificationService: DocumentVerificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lista documentos enviados para verificacao, com filtros' })
  listDocuments(@Query() query: ListDocumentVerificationsQueryDto) {
    return this.documentVerificationService.listDocuments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um documento enviado para verificacao' })
  getDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentVerificationService.getDocumentById(id);
  }

  @Patch(':id/review')
  @ApiOperation({ summary: 'Aprova ou rejeita um documento enviado para verificacao' })
  reviewDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewDocumentVerificationDto,
  ) {
    return this.documentVerificationService.reviewDocument(id, user.id, dto);
  }
}
