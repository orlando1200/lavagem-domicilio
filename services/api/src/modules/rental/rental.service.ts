
  // ─── Partners ─────────────────────────────────────────────────────────────

  async createPartner(dto: CreateRentalPartnerDto) {
    return this.prisma.rentalPartner.create({ data: dto });
  }

  async listPartners(dto: ListRentalPartnersDto) {
    const where: Record<string, unknown> = {};
    if (dto.status) where.status = dto.status;

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.rentalPartner.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { offers: true, leads: true } } },
        }),
        this.prisma.rentalPartner.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.rentalPartner.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { offers: true, leads: true } } },
      }),
      this.prisma.rentalPartner.count({ where }),
    ]);

    const nextCursor = data.length === dto.limit ? data[data.length - 1].id : null;
    return { data, total, nextCursor };
  }

  async findOnePartner(id: string) {
    const partner = await this.prisma.rentalPartner.findUnique({














































    });
  }

  async listOffers(dto: ListRentalOffersDto) {
    const where: Record<string, unknown> = {};
    if (dto.status) where.status = dto.status;
    if (dto.partnerId) where.partnerId = dto.partnerId;
    if (dto.city) where.city = { contains: dto.city, mode: 'insensitive' };
    if (dto.state) where.state = dto.state.toUpperCase();
    if (dto.pricePeriod) where.pricePeriod = dto.pricePeriod;

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.rentalOffer.findMany({
          where,
          take: limit,
          skip,
          orderBy: { priceAmount: 'asc' },
          include: { partner: { select: { id: true, name: true, phone: true, email: true } } },
        }),
        this.prisma.rentalOffer.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.rentalOffer.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { priceAmount: 'asc' },
        include: { partner: { select: { id: true, name: true, phone: true, email: true } } },
      }),
      this.prisma.rentalOffer.count({ where }),
    ]);

    const nextCursor = data.length === dto.limit ? data[data.length - 1].id : null;
    return { data, total, nextCursor };
  }

  async findOneOffer(id: string) {
    const offer = await this.prisma.rentalOffer.findUnique({
