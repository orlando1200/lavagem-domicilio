  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import {
  ProductStatus,
  SupplierStatus,
  DriverStatus,
  StorePlan,
  LogisticsType,
  ProductApprovalStatus,
  ProductStorefront,
  CommissionType,
} from '@prisma/client';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateProductDto,
  UpdateProductDto,
  ListProductsDto,

  // ─── Suppliers ────────────────────────────────────────────────────────────

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async listSuppliers(dto: ListSuppliersDto) {
    const where: Record<string, unknown> = {};
    if (dto.status) where.status = dto.status;

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { products: true } } },
        }),
        this.prisma.supplier.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    const nextCursor = data.length === dto.limit ? data[data.length - 1].id : null;
    return { data, total, nextCursor };
  }

  async findOneSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
    return this.registerStore(dto);
  }

  async listSuppliers(dto: ListSuppliersDto) {
    const where: Record<string, unknown> = {};
    if (dto.status) where.status = dto.status;
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.supplier.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { _count: { select: { products: true } } },
        }),
        this.prisma.supplier.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.supplier.count({ where }),
    ]);

  // ─── Products ─────────────────────────────────────────────────────────────

  async createProduct(dto: CreateProductDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier || supplier.status === SupplierStatus.blocked) {
    });
  }

  async listProducts(dto: ListProductsDto) {
    const where: Record<string, unknown> = {};
    if (dto.category) where.category = dto.category;
    if (dto.status) where.status = dto.status;
    if (dto.supplierId) where.supplierId = dto.supplierId;

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: { supplier: { select: { id: true, name: true, status: true } } },
        }),
        this.prisma.product.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { id: true, name: true, status: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    const nextCursor = data.length === dto.limit ? data[data.length - 1].id : null;
    return { data, total, nextCursor };
  }

  async findOneProduct(id: string) {
    const product = await this.prisma.product.findUnique({
  async listProducts(dto: ListProductsDto) {
    const where: Record<string, unknown> = {};
    if (plan === StorePlan.own_logistics || logisticsType === LogisticsType.supplier) {
      return { monthlyFee: 110, takeRate: 0.1, minimumBilling: 1800 };
    }
    return { monthlyFee: 150, takeRate: 0.23, minimumBilling: 1800 };
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  async submitProduct(dto: CreateProductDto) {
    return this.createProduct({ ...dto, status: ProductStatus.draft });
  }

  async createProduct(dto: CreateProductDto) {
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: {
            supplier: { select: { id: true, name: true, status: true, email: true, phone: true, document: true } },
            images: { select: { url: true }, take: 1 },
          },
        }),
        this.prisma.product.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, status: true, email: true, phone: true, document: true } },
          images: { select: { url: true }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    });
  }

  async listProducts(dto: ListProductsDto) {
    const where: Record<string, unknown> = {};
    if (dto.category) where.category = dto.category;
    if (dto.status) where.status = dto.status;
    if (dto.approvalStatus) where.approvalStatus = dto.approvalStatus;
    if (dto.storefront) where.storefront = dto.storefront;
    if (dto.supplierId) where.supplierId = dto.supplierId;
    if (dto.isStarterKit !== undefined) where.isStarterKit = dto.isStarterKit;
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { sku: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    if (dto.page) {
      const page = dto.page;
      const limit = dto.limit;
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          include: {
            supplier: { select: { id: true, name: true, status: true, email: true, phone: true, document: true, plan: true } },
            images: { select: { url: true }, take: 1 },
          },
        }),
        this.prisma.product.count({ where }),
      ]);
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    });
  }

  async removeProduct(id: string) {
    await this.findOneProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.inactive },
    });
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateSku(name: string): string {
    const prefix = name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-zA-Z0-9]+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 5);
    return `${prefix || 'SKU'}-${Math.floor(Math.random() * 100000)}`;
  }

  // ─── Public Catalog ───────────────────────────────────────────────────────

      where: { slug },
      include: {
        supplier: { select: { id: true, name: true } },
        images: { include: { file: true } },
      },
    });
    if (!product || product.status !== ProductStatus.active || product.approvalStatus !== ProductApprovalStatus.approved) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.findOneProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { supplier: true },
    });
  }

  async approveProduct(id: string, dto: ApproveProductDto, adminUserId: string) {
    const product = await this.findOneProduct(id);
    if (dto.approvalStatus === ProductApprovalStatus.approved) {
      return this.prisma.product.update({
        where: { id },
        data: {
          approvalStatus: ProductApprovalStatus.approved,
          status: ProductStatus.active,
          storefront: dto.storefront ?? product.storefront,
          approvedAt: new Date(),
          approvedByUserId: adminUserId,
          rejectionReason: null,
        },
        include: { supplier: true },
      });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        approvalStatus: ProductApprovalStatus.rejected,
        status: ProductStatus.rejected,
        rejectionReason: dto.rejectionReason,
      },
      include: { supplier: true },
    });
  }

  async removeProduct(id: string) {
    await this.findOneProduct(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.inactive },
    });
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private generateSku(name: string): string {
    const prefix = name
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-zA-Z0-9]+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 5);
    return `${prefix || 'SKU'}-${Math.floor(Math.random() * 100000)}`;
  }

  // ─── Public Catalog ───────────────────────────────────────────────────────

  async getPublicCatalog(dto: ListProductsDto, storefront?: ProductStorefront) {
    const where: Record<string, unknown> = {
      status: ProductStatus.active,
      approvalStatus: ProductApprovalStatus.approved,
    };
    if (dto.category) where.category = dto.category;
    if (dto.supplierId) where.supplierId = dto.supplierId;
    if (storefront) {
      where.OR = [{ storefront }, { storefront: ProductStorefront.both }];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        take: dto.limit,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, plan: true } },
          images: { include: { file: { select: { id: true, storageKey: true, mimeType: true } } } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const nextCursor = data.length === dto.limit ? data[data.length - 1].id : null;
    return { data, total, nextCursor };
  }

  async getStorefrontCatalog(storefront: ProductStorefront, dto: ListProductsDto) {
    return this.getPublicCatalog(dto, storefront);
  }

  // ─── Marketplace Orders ───────────────────────────────────────────────────

  async createOrder(buyerUserId: string, dto: CreateMarketplaceOrderDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier || supplier.status !== SupplierStatus.active) {
      throw new NotFoundException('Supplier not found or inactive');
    }

    const driverProfile = await this.prisma.driverProfile.findUnique({
      where: { userId: buyerUserId },
      select: { status: true },
    });

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        supplierId: dto.supplierId,
        status: ProductStatus.active,
        approvalStatus: ProductApprovalStatus.approved,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found, inactive, or not from this supplier');
    }

    if (driverProfile?.status === DriverStatus.awaiting_kit) {
      const nonKitProducts = products.filter((p) => !p.isStarterKit);
      if (nonKitProducts.length > 0) {
        throw new ForbiddenException('Drivers in awaiting_kit status may only purchase starter kit products');
      }
    }

    let subtotal = 0;
    let totalCommission = 0;
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      const commissionPerUnit =
        product.commissionType === 'percent'
          ? unitPrice * (Number(product.commissionValue) / 100)
          : Number(product.commissionValue);
      totalCommission += commissionPerUnit * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const shippingAmount = 0;
    const totalAmount = subtotal + shippingAmount;
    const orderNumber = `LDM-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.marketplaceOrder.create({
      data: {
        orderNumber,
        buyerUserId,
        supplierId: dto.supplierId,
        subtotal,
        shippingAmount,
        commissionAmount: totalCommission,
        totalAmount,
        items: { create: orderItems },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        supplier: { select: { id: true, name: true } },
      },
    });
  }

  // ─── Financial Split / Payouts ────────────────────────────────────────────

  calculateOrderSplit(supplierId: string, subtotal: number) {
    // Esta função é síncrona e espera os dados do supplier já carregados.
    // Para uso real, chame calculatePayout após buscar o supplier.
    return { platformCommission: 0, supplierNet: 0, shippingCost: 0, monthlyFee: 0 };
  }

  async calculatePayout(supplierId: string, periodStart: Date, periodEnd: Date) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const orders = await this.prisma.marketplaceOrder.findMany({
      where: {
        supplierId,
        createdAt: { gte: periodStart, lte: periodEnd },
        paymentStatus: 'paid',
      },
    });

    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const shippingCost = supplier.logisticsType === LogisticsType.platform
      ? orders.reduce((sum, order) => sum + Number(order.shippingAmount), 0)
      : 0;

    const commission = totalSales * Number(supplier.takeRate);
    const monthlyFee = totalSales >= Number(supplier.minimumBilling) ? Number(supplier.monthlyFee) : 0;
    const netAmount = totalSales - commission - shippingCost - monthlyFee;

    return {
      supplierId,
      periodStart,
      periodEnd,
      totalSales,
      commission,
      shippingCost,
      monthlyFee,
      netAmount,
      ordersCount: orders.length,
    };
  }

  async createPayout(supplierId: string, periodStart: Date, periodEnd: Date) {
    const calc = await this.calculatePayout(supplierId, periodStart, periodEnd);
    return this.prisma.supplierPayout.create({
      data: {
        supplierId,
        periodStart,
        periodEnd,
        totalSales: calc.totalSales,
        commission: calc.commission,
        shippingCost: calc.shippingCost,
        monthlyFee: calc.monthlyFee,
        netAmount: calc.netAmount,
        status: 'pending',
      },
    });
  }

  async listSupplierPayouts(supplierId: string) {
    return this.prisma.supplierPayout.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Marketplace Orders ───────────────────────────────────────────────────

    if (role !== 'admin') where.buyerUserId = userId;
    if (dto.status) where.status = dto.status;
