import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { DocumentVerificationService } from './document-verification.service';
import { CreateDocumentVerificationDto, UploadDocumentDto } from './dto/document-verification.dto';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Envia um documento para verificacao com upload binario real (modo simulado — disco local)',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatorio');
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Arquivo excede o tamanho maximo de 10MB');
    }

    const originUrl = `${req.protocol}://${req.get('host')}`;

    return this.documentVerificationService.uploadDocument(
      user.id,
      dto.docType,
      { buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype },
      originUrl,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista os documentos enviados pelo usuario autenticado' })
  listMyDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.documentVerificationService.listMyDocuments(user.id);
  }
}
