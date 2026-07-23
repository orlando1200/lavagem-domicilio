    });
  }

  // ─── Admin: Upsert Active Config ────────────────────────────────────────────

  async adminUpsertActiveConfig(dto: UpdateStarterKitConfigDto) {
    const existing = await this.prisma.starterKitConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = {
      ...(dto.productId !== undefined && { productId: dto.productId }),
      ...(dto.minPrice !== undefined && { minPrice: dto.minPrice }),
      ...(dto.maxPrice !== undefined && { maxPrice: dto.maxPrice }),
      ...(dto.maxInstallments !== undefined && { maxInstallments: dto.maxInstallments }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    if (existing) {
      return this.prisma.starterKitConfig.update({
        where: { id: existing.id },
        data,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      });
    }

    return this.prisma.starterKitConfig.create({
      data: {
        productId: dto.productId ?? '',
        minPrice: dto.minPrice ?? 900,
        maxPrice: dto.maxPrice ?? 1000,
        maxInstallments: dto.maxInstallments ?? 12,
        isActive: dto.isActive ?? true,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });
  }
}

    const map: Record<string, TransactionStatus> = {
      approved: TransactionStatus.paid,
      authorized: TransactionStatus.authorized,
      approved: TransactionStatus.paid,
      authorized: TransactionStatus.authorized,
      pending: TransactionStatus.pending,
      in_process: TransactionStatus.pending,
      in_mediation: TransactionStatus.pending,
      rejected: TransactionStatus.failed,
      cancelled: TransactionStatus.cancelled,
      refunded: TransactionStatus.refunded,
      charged_back: TransactionStatus.refunded,
    };

    return map[mpStatus] ?? TransactionStatus.pending;
  }
}

