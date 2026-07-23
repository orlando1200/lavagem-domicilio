      throw new NotFoundException('Support ticket not found');
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.assignedAdminUserId !== undefined
          ? { assignedAdminUserId: dto.assignedAdminUserId }
          : {}),
      },
      include: { requester: { include: { profile: true } } },
    });
  }

  async closeMine(id: string, requesterUserId: string) {
















































































    });
  }

  private async list(query: ListSupportTicketsDto & { requesterUserId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: any = {
      ...(query.requesterUserId ? { requesterUserId: query.requesterUserId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
    };
    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { requester: { email: { contains: query.search, mode: 'insensitive' } } },
        { requester: { profile: { fullName: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
          requester: { include: { profile: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { data: data.map(toTicketResponse), total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

function toTicketResponse(ticket: any) {
  return {
    id: ticket.id,
    protocol: `SUP-${ticket.id.slice(0, 8).toUpperCase()}`,
    subject: ticket.subject,
    customerName: ticket.requester?.profile?.fullName ?? ticket.requester?.email ?? 'Cliente',
    customerEmail: ticket.requester?.email,
    channel: ticket.channel ?? 'app',
    priority: ticket.priority,
    status: mapTicketStatusToFrontend(ticket.status),
    assignedTo: ticket.assignedAdminUserId,
    lastInteractionAt: ticket.updatedAt?.toISOString?.() ?? ticket.updatedAt,
    createdAt: ticket.createdAt?.toISOString?.() ?? ticket.createdAt,
    tags: [],
    messages: [],
  };
}

function mapTicketStatusToFrontend(status: string): 'open' | 'in_progress' | 'waiting_customer' | 'resolved' {
  switch (status) {
    case 'open':
      return 'open';
    case 'pending_internal':
      return 'in_progress';
    case 'pending_user':
      return 'waiting_customer';
    case 'resolved':
    case 'closed':
      return 'resolved';
    default:
      return 'open';
  }
}
