import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSupportTicketDto,
  ListSupportTicketsQueryDto,
  UpdateSupportTicketStatusDto,
} from './dto/support.dto';

const SUPPORT_TICKET_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.SupportTicketInclude;

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  createTicket(userId: string, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: { userId, subject: dto.subject, message: dto.message },
    });
  }

  listMyTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listTicketsForAdmin(query: ListSupportTicketsQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

    const where: Prisma.SupportTicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { subject: { contains: query.search, mode: 'insensitive' } },
              { user: { name: { contains: query.search, mode: 'insensitive' } } },
              { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: SUPPORT_TICKET_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data: items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTicketByIdForAdmin(id: string) {
    return this.findTicketOrThrow(id);
  }

  async updateStatusAsAdmin(id: string, dto: UpdateSupportTicketStatusDto) {
    await this.findTicketOrThrow(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: dto.status },
      include: SUPPORT_TICKET_INCLUDE,
    });
  }

  private async findTicketOrThrow(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) {
      throw new NotFoundException('Ticket de suporte nao encontrado');
    }
    return ticket;
  }
}
