      `Saque processado #${payout.id.slice(0, 8)}`,
    );

    return this.prisma.driverPayout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.paid,
        paidAt: new Date(),
        providerReference: dto.providerReference ?? payout.providerReference,
      },
      include: { driver: { include: { user: { include: { profile: true } }, bankAccounts: true } } },
    });
  }

  async rejectPayout(payoutId: string, dto: AdminRejectPayoutDto) {
































      this.prisma.driverPayout.count({ where }),
    ]);

    return { data: payouts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async listAllPayouts(query: ListPayoutsDto) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.washerId) where.driverUserId = query.washerId;
    if (query.search) {
      where.driver = {
        user: {
          OR: [
            { email: { contains: query.search, mode: 'insensitive' } },
            { profile: { fullName: { contains: query.search, mode: 'insensitive' } } },
          ],
        },
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
      this.prisma.driverPayout.count({ where }),
    ]);

    return { data: payouts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approvePayout(payoutId: string, dto: AdminApprovePayoutDto) {
        include: {
          driver: { include: { user: { include: { profile: true } }, bankAccounts: true } },
        },
      }),
      this.prisma.driverPayout.count({ where }),
    ]);

    return { data: payouts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approvePayout(payoutId: string, dto: AdminApprovePayoutDto) {
    const payout = await this.prisma.driverPayout.findUnique({ where: { id: payoutId } });
