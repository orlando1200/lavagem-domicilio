import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  submitDocument(userId: string, dto: CreateDocumentVerificationDto) {
    return this.prisma.documentVerification.create({
      data: { userId, docType: dto.docType, fileUrl: dto.fileUrl },
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
    await this.findDocumentOrThrow(id);

    return this.prisma.documentVerification.update({
      where: { id },
      data: { status: dto.status, reviewedByUserId: adminUserId },
      include: DOCUMENT_VERIFICATION_INCLUDE,
    });
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
