import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
import { CreateDocumentVerificationDto } from './dto/document-verification.dto';

@ApiTags('document-verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAVADOR)
@Controller('document-verification/me')
export class DocumentVerificationController {
  constructor(private readonly documentVerificationService: DocumentVerificationService) {}

  @Post()
  @ApiOperation({ summary: 'Envia um documento para verificacao (link do arquivo ja hospedado)' })
  submitDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentVerificationDto,
  ) {
    return this.documentVerificationService.submitDocument(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os documentos enviados pelo usuario autenticado' })
  listMyDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.documentVerificationService.listMyDocuments(user.id);
  }
}
