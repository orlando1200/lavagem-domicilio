  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { service: { include: { category: true, vehicleRules: true } } } },
        client: { include: { profile: true } },
        driver: { include: { profile: true, driverProfile: true } },
        vehicle: true,
        serviceAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        photos: { include: { file: true } },
        paymentTransactions: true,
        chatConversations: { include: { messages: { orderBy: { createdAt: 'asc' } } } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');


























    });
  }

  async updateStatusAsAdmin(orderId: string, newStatus: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const mappedStatus = this.mapClientStatusToOrderStatus(newStatus);

    const timestamps: Record<string, Date> = {};
    if (mappedStatus === OrderStatus.driver_arriving) timestamps.acceptedAt = new Date();
    if (mappedStatus === OrderStatus.in_progress) timestamps.startedAt = new Date();
    if (mappedStatus === OrderStatus.completed) timestamps.completedAt = new Date();
    if (mappedStatus === OrderStatus.cancelled) timestamps.cancelledAt = new Date();

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: mappedStatus,
        ...timestamps,
        statusHistory: {
          create: {
            oldStatus: order.status,
            newStatus: mappedStatus,
            changedByUserId: 'system',
            reason: reason || 'Status updated by admin',
          },
        },
      },
    });
  }

  async cancel(id: string, userId: string, role: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });






























































































  }

  async findAllAdmin(dto: any) {
    const page = Number(dto.page ?? 1);
    const limit = Math.min(Number(dto.limit || 20), 100);
    const where: any = {};

    if (dto.status) {
      where.status = dto.status;
    }
    if (dto.search) {
      where.OR = [
        { orderNumber: { contains: dto.search, mode: 'insensitive' } },
        { client: { email: { contains: dto.search, mode: 'insensitive' } } },
        { client: { profile: { fullName: { contains: dto.search, mode: 'insensitive' } } } },
      ];
    }
    if (dto.washerId) {
      where.driverUserId = dto.washerId;
    }
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);


        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { service: { include: { category: true, vehicleRules: true } } } },
          client: { include: { profile: true } },
          driver: { include: { profile: true, driverProfile: true } },
          vehicle: true,
          serviceAddress: true,
          paymentTransactions: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.toAdminOrder(o)),
      total,
      page,
      limit,
    };
  }

  async findOneAdmin(id: string) {
  async findOneAdmin(id: string) {
























































































































































    return mapped;
  }

  private mapVehicleSize(sizeTier?: string): string {
    const map: Record<string, string> = {
      moto: 'small',
      pequeno: 'small',
      hatch: 'small',
      sedan: 'medium',
      medio: 'medium',
      large: 'large',
      suv: 'suv',
      pickup: 'truck',
      caminhonete: 'truck',
      van: 'truck',
      utility: 'truck',
    };
    return map[sizeTier ?? ''] || 'medium';
  }
}




























    });
  }

  async getChatMessagesAdmin(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    const messages = await this.getChatMessages(orderId, '', UserRole.admin);
    return messages.map((m: any) => this.mapChatMessage(m, order));
    };
  }

  private toAdminOrder(order: any) {
    const paymentTx = order.paymentTransactions?.slice().sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    const payload = (paymentTx?.payload as Record<string, any>) || {};
    const pixCode = order.paymentMethod === 'pix' ? payload?.point_of_interaction?.transaction_data?.qr_code || payload?.qr_code || null : null;
    const paymentUrl = order.paymentMethod === 'pix'
      ? payload?.point_of_interaction?.transaction_data?.ticket_url || payload?.ticket_url || null
      : payload?.init_point || payload?.paymentUrl || null;

    const firstItem = order.items?.[0];
    const vehicleSize = this.mapVehicleSize(order.vehicle?.sizeTier);

    const addressString = order.serviceAddress
      ? `${order.serviceAddress.street}, ${order.serviceAddress.number}${
          order.serviceAddress.complement ? ` - ${order.serviceAddress.complement}` : ''
        } - ${order.serviceAddress.neighborhood}, ${order.serviceAddress.city} - ${order.serviceAddress.state}`
      : '';

    return {
      id: order.id,
      code: order.orderNumber,
      status: this.mapStatusToClient(order.status),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      scheduledAt: order.scheduledFor ?? order.createdAt,
      totalPrice: Number(order.totalAmount),
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      platformFee: Number(order.platformFee),
      driverPayoutAmount: Number(order.driverPayoutAmount),
      pixCode,
      paymentUrl,
      customerId: order.clientUserId,
      customer: order.client ? {
        id: order.client.id,
        name: order.client.profile?.fullName || order.client.email,
        email: order.client.email,
        phone: order.client.profile?.phone,
        role: 'customer',
        active: true,
        createdAt: order.client.createdAt,
      } : null,
      washerId: order.driverUserId,
      washer: order.driver ? {
        id: order.driver.driverProfile?.id || order.driver.id,
        userId: order.driver.id,
        user: {
          id: order.driver.id,
          name: order.driver.profile?.fullName || order.driver.email,
          email: order.driver.email,
          phone: order.driver.profile?.phone,
          role: 'washer',
          active: true,
          createdAt: order.driver.createdAt,
        },
        rating: Number(order.driver.driverProfile?.averageRating ?? 4.7),
        completedOrders: order.driver.driverProfile?.totalOrders ?? 0,
        active: order.driver.driverProfile?.status === 'active',
        verifiedAt: order.driver.driverProfile?.verifiedAt,
        createdAt: order.driver.createdAt,
      } : null,
      serviceId: firstItem?.serviceId || '',
      service: firstItem ? {
        id: firstItem.serviceId,
        name: firstItem.serviceName,
        description: firstItem.service?.description || '',
        categoryId: firstItem.service?.categoryId || '',
        category: firstItem.service?.category ? {
          id: firstItem.service.category.id,
          name: firstItem.service.category.name,
          active: true,
          createdAt: firstItem.service.category.createdAt,
        } : undefined,
        prices: firstItem.service?.vehicleRules?.map((rule: any) => ({
          size: this.mapVehicleSize(rule.vehicleSizeTier),
          price: Number(rule.basePrice),
        })) || [],
        active: firstItem.service?.isActive ?? true,
        createdAt: firstItem.service?.createdAt || order.createdAt,
      } : null,
      vehicleSize,
      address: addressString,
      addressLat: order.serviceAddress?.latitude ? Number(order.serviceAddress.latitude) : null,
      addressLng: order.serviceAddress?.longitude ? Number(order.serviceAddress.longitude) : null,
      notes: order.customerNotes,
      items: order.items,
      timeline: (order.statusHistory || []).map((h: any) => ({
        id: h.id,
        status: this.mapStatusToClient(h.newStatus),
        note: h.reason,
        createdAt: h.createdAt,
        createdBy: h.changedByUserId,
      })),
      photos: (order.photos || []).map((p: any) => ({
        id: p.id,
        type: p.photoType || 'before',
        url: p.file?.storageKey ? `/files/${p.file.storageKey}` : p.url,
        createdAt: p.createdAt,
      })),
      chatMessages: order.chatConversations?.[0]?.messages ?? [],
    };
  }

  private mapStatusToClient(status: OrderStatus): string {
    return STATUS_TO_CLIENT[status] || status;
  }

  private mapVehicleSize(sizeTier?: string): string {
    const map: Record<string, string> = {
      moto: 'small',
      pequeno: 'small',
      hatch: 'small',
      sedan: 'medium',
      medio: 'medium',
      suv: 'suv',
      pickup: 'truck',
      caminhonete: 'truck',
      van: 'truck',
      utility: 'truck',
    };
    return map[sizeTier ?? ''] || 'medium';
  }
}


}


  }

  private mapVehicleSize(sizeTier?: string): string {
    const map: Record<string, string> = {
      moto: 'small',
      pequeno: 'small',
      hatch: 'small',
      sedan: 'medium',
      medio: 'medium',
      large: 'medium',
      suv: 'suv',
      pickup: 'truck',
      caminhonete: 'truck',
      van: 'truck',
      utility: 'truck',
    };
    return map[sizeTier ?? ''] || 'medium';
  }
}


    };
    const mapped = map[status];
    if (!mapped) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    return mapped;
  }

  private mapVehicleSize(sizeTier?: string): string {
    const map: Record<string, string> = {
