import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentVerificationStatus } from '@prisma/client';
import { DocumentVerificationService } from '../../../src/modules/document-verification/document-verification.service';
import { PrismaService } from '../../../src/database/prisma.service';
import { NotificationsService } from '../../../src/modules/notifications/notifications.service';

const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';
const DOCUMENT_ID = 'doc-1';

describe('DocumentVerificationService', () => {
  let service: DocumentVerificationService;
  let module: TestingModule;
  let prisma: {
    documentVerification: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      documentVerification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      providers: [
        DocumentVerificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<DocumentVerificationService>(DocumentVerificationService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('submitDocument', () => {
    it('creates a document verification for the given user', async () => {
      prisma.documentVerification.create.mockResolvedValue({ id: DOCUMENT_ID });

      await service.submitDocument(USER_ID, {
        docType: 'CNH',
        fileUrl: 'https://example.com/doc.pdf',
      } as any);

      expect(prisma.documentVerification.create).toHaveBeenCalledWith({
        data: { userId: USER_ID, docType: 'CNH', fileUrl: 'https://example.com/doc.pdf' },
      });
    });
  });

  describe('listMyDocuments', () => {
    it('lists documents scoped to the requesting user', async () => {
      prisma.documentVerification.findMany.mockResolvedValue([{ id: DOCUMENT_ID }]);

      const result = await service.listMyDocuments(USER_ID);

      expect(prisma.documentVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('getDocumentById / reviewDocument', () => {
    it('throws NotFoundException when the document does not exist', async () => {
      prisma.documentVerification.findUnique.mockResolvedValue(null);

      await expect(service.getDocumentById(DOCUMENT_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('reviewDocument throws NotFoundException when the document does not exist', async () => {
      prisma.documentVerification.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewDocument(DOCUMENT_ID, ADMIN_ID, {
          status: DocumentVerificationStatus.approved,
        } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.documentVerification.update).not.toHaveBeenCalled();
    });

    it('reviewDocument sets status and reviewedByUserId on success', async () => {
      prisma.documentVerification.findUnique.mockResolvedValue({ id: DOCUMENT_ID });
      prisma.documentVerification.update.mockResolvedValue({
        id: DOCUMENT_ID,
        status: DocumentVerificationStatus.approved,
        reviewedByUserId: ADMIN_ID,
      });

      const result = await service.reviewDocument(DOCUMENT_ID, ADMIN_ID, {
        status: DocumentVerificationStatus.approved,
      } as any);

      expect(prisma.documentVerification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: DOCUMENT_ID },
          data: { status: DocumentVerificationStatus.approved, reviewedByUserId: ADMIN_ID },
        }),
      );
      expect(result.status).toBe(DocumentVerificationStatus.approved);
    });
  });

  describe('listDocuments', () => {
    it('returns paginated results with default page/limit', async () => {
      prisma.documentVerification.findMany.mockResolvedValue([{ id: DOCUMENT_ID }]);
      prisma.documentVerification.count.mockResolvedValue(1);

      const result = await service.listDocuments({} as any);

      expect(result).toEqual({
        data: [{ id: DOCUMENT_ID }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });
});
