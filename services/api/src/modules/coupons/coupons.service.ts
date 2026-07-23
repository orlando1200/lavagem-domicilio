    });
  }

  async findAll(query: ListCouponsDto) {
    const where: Record<string, unknown> = {};
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
      this.prisma.coupon.count({ where }),
    ]);

    return { items: coupons, total, page, limit };
  }

  async findOne(id: string) {
