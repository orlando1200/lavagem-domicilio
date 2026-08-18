import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DocumentVerificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { STORAGE_ADAPTER, StorageAdapter, StoredFileInput } from './storage/storage.interface';
import {
  CreateDocumentVerificationDto,
  ListDocumentVerificationsQueryDto,
  ReviewDocumentVerificationDto,
} from './dto/document-verification.dto';

const DOCUMENT_VERIFICATION_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.DocumentVerificationInclude;

@Injectable()
export class DocumentVerificationService {
  private readonly logger = new Logger(DocumentVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {}

  submitDocument(userId: string, dto: CreateDocumentVerificationDto) {
    return this.prisma.documentVerification.create({
      data: { userId, docType: dto.docType, fileUrl: dto.fileUrl },
    });
  }

  /**
   * Envia o documento com upload binario real (salvo em disco local —
   * modo simulado, ver `storage/local-disk.adapter.ts`), em vez de exigir
   * um link ja hospedado como `submitDocument` faz.
   */
  async uploadDocument(userId: string, docType: string, file: StoredFileInput, originUrl: string) {
    const { url } = await this.storage.save(file);

    return this.prisma.documentVerification.create({
      data: { userId, docType, fileUrl: `${originUrl}${url}` },
    });
  }

  listMyDocuments(userId: string) {
    return this.prisma.documentVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDocuments(query: ListDocumentVerificationsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.DocumentVerificationWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.search
        ? {
            OR: [
              { docType: { contains: query.search, mode: 'insensitive' } },
              { user: { name: { contains: query.search, mode: 'insensitive' } } },
              { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.documentVerification.findMany({
        where,
        include: DOCUMENT_VERIFICATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.documentVerification.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDocumentById(id: string) {
    return this.findDocumentOrThrow(id);
  }

  async reviewDocument(id: string, adminUserId: string, dto: ReviewDocumentVerificationDto) {
    const document = await this.findDocumentOrThrow(id);

    if (dto.status === DocumentVerificationStatus.rejected && !dto.rejectionReason) {
      throw new BadRequestException('Informe o motivo da rejeicao');
    }

    const updated = await this.prisma.documentVerification.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedByUserId: adminUserId,
        rejectionReason:
          dto.status === DocumentVerificationStatus.rejected ? dto.rejectionReason : null,
      },
      include: DOCUMENT_VERIFICATION_INCLUDE,
    });

    await this.notifyReviewBestEffort(document.userId, updated.id, dto.status, dto.rejectionReason);

    return updated;
  }

  private async notifyReviewBestEffort(
    userId: string,
    documentId: string,
    status: DocumentVerificationStatus,
    rejectionReason?: string,
  ) {
    try {
      const approved = status === DocumentVerificationStatus.approved;
      await this.notificationsService.create(userId, {
        type: 'document_reviewed',
        title: approved ? 'Documento aprovado' : 'Documento rejeitado',
        body: approved
          ? 'Seu documento foi aprovado.'
          : `Seu documento foi rejeitado. Motivo: ${rejectionReason}`,
        relatedEntityId: documentId,
      });
    } catch (error) {
      this.logger.warn(
        `Nao foi possivel notificar a revisao do documento ${documentId}: ${(error as Error).message}`,
      );
    }
  }

  private async findDocumentOrThrow(id: string) {
    const document = await this.prisma.documentVerification.findUnique({
      where: { id },
      include: DOCUMENT_VERIFICATION_INCLUDE,
    });
    if (!document) {
      throw new NotFoundException('Documento nao encontrado');
    }
    return document;
  }
}
