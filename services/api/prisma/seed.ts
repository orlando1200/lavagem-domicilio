/**
 * Seed de dados de exemplo para desenvolvimento local. Idempotente: usa
 * `upsert` por chave unica (email, slug) sempre que possivel, para poder
 * rodar de novo sem duplicar usuarios/produtos. Os 7 pedidos de exemplo
 * (um por status) sao a excecao — nao tem chave natural, entao so sao
 * criados se nenhum pedido marcado com `SEED_MARKER` existir ainda.
 *
 * Uso: pnpm --filter api seed:dev
 */
import {
  PrismaClient,
  Prisma,
  UserRole,
  VehicleType,
  DriverType,
  DriverStatus,
  ServiceType,
  StoreType,
  LogisticsPlan,
  StoreStatus,
  ProductStatus,
  CatalogTarget,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CarSize,
  WashType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const SEED_PASSWORD = 'Senha123!';
const SEED_MARKER = '[seed]';

// Mesma formula de services/api/src/modules/loyalty/loyalty.service.ts
// (EARN_RATE 5%, 1 ponto = R$0.01) — replicada aqui porque o seed roda
// fora do contexto de DI do Nest.
const POINTS_PER_REAL = 5;
const POINTS_EXPIRY_DAYS = 90;

async function hashPassword(): Promise<string> {
  return bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);
}

async function main() {
  console.log('Seeding banco de desenvolvimento...\n');
  const passwordHash = await hashPassword();

  // ── Zona ────────────────────────────────────────────────────────────
  const zone = await prisma.zone.upsert({
    where: { slug: 'sp-centro' },
    update: {},
    create: {
      city: 'São Paulo',
      state: 'SP',
      name: 'São Paulo - Centro',
      slug: 'sp-centro',
      neighborhoods: ['Sé', 'República', 'Bela Vista', 'Consolação'],
    },
  });
  console.log(`Zona: ${zone.name}`);

  // ── Admin ───────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@giucar.com.br' },
    update: {},
    create: {
      name: 'Admin GIUCAR',
      email: 'admin@giucar.com.br',
      phone: '+5511900000000',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log(`Admin: ${admin.email}`);

  // ── Clientes (3), cada um com 1 veiculo + 1 endereco ──────────────────
  const clientesData = [
    {
      name: 'Ana Cliente',
      email: 'ana.cliente@giucar.com.br',
      vehicle: { type: VehicleType.carro, brand: 'Fiat', model: 'Argo', plate: 'ABC1D23', color: 'Prata' },
      address: { street: 'Rua Augusta', number: '100', neighborhood: 'Consolação', zipCode: '01305-000' },
    },
    {
      name: 'Bruno Cliente',
      email: 'bruno.cliente@giucar.com.br',
      vehicle: { type: VehicleType.moto, brand: 'Honda', model: 'CG 160', plate: 'DEF4G56', color: 'Vermelha' },
      address: { street: 'Alameda Santos', number: '200', neighborhood: 'Bela Vista', zipCode: '01419-000' },
    },
    {
      name: 'Carla Cliente',
      email: 'carla.cliente@giucar.com.br',
      vehicle: { type: VehicleType.carro, brand: 'Volkswagen', model: 'Gol', plate: 'GHI7J89', color: 'Branco' },
      address: { street: 'Rua da Consolação', number: '300', neighborhood: 'Consolação', zipCode: '01301-000' },
    },
  ];

  const clientes: { user: Awaited<ReturnType<typeof prisma.user.upsert>>; vehicleId: string; addressId: string }[] = [];
  for (const c of clientesData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { name: c.name, email: c.email, phone: '+55119' + Math.floor(1e7 + Math.random() * 9e7), passwordHash, role: UserRole.CLIENTE },
    });
    const vehicle =
      (await prisma.vehicle.findFirst({ where: { userId: user.id } })) ??
      (await prisma.vehicle.create({ data: { userId: user.id, ...c.vehicle } }));
    const address =
      (await prisma.address.findFirst({ where: { userId: user.id } })) ??
      (await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Casa',
          street: c.address.street,
          number: c.address.number,
          neighborhood: c.address.neighborhood,
          city: 'São Paulo',
          state: 'SP',
          zipCode: c.address.zipCode,
          isDefault: true,
        },
      }));
    clientes.push({ user, vehicleId: vehicle.id, addressId: address.id });
    console.log(`Cliente: ${user.email}`);
  }

  // ── Lavadores (3): moto, carro, loja de carwash ───────────────────────
  const lavadoresData = [
    {
      name: 'Diego Moto',
      email: 'diego.moto@giucar.com.br',
      driverType: DriverType.MOTO_WASHER,
      allowed: [ServiceType.DRY_WASH, ServiceType.EXPRESS_WASH],
    },
    {
      name: 'Eduarda Carro',
      email: 'eduarda.carro@giucar.com.br',
      driverType: DriverType.CAR_WASHER,
      allowed: [ServiceType.DRY_WASH, ServiceType.EXPRESS_WASH, ServiceType.HEAVY_SERVICE],
    },
    {
      name: 'Fábio Loja',
      email: 'fabio.carwash@giucar.com.br',
      driverType: DriverType.CARWASH_SHOP,
      allowed: [ServiceType.HEAVY_SERVICE],
    },
  ];

  const lavadores: { user: Awaited<ReturnType<typeof prisma.user.upsert>>; profileUserId: string }[] = [];
  for (const d of lavadoresData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: { name: d.name, email: d.email, phone: '+55119' + Math.floor(1e7 + Math.random() * 9e7), passwordHash, role: UserRole.LAVADOR },
    });
    await prisma.driverProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        driverType: d.driverType,
        allowedServices: d.allowed,
        currentZoneId: zone.id,
        status: DriverStatus.active,
      },
    });
    lavadores.push({ user, profileUserId: user.id });
    console.log(`Lavador: ${user.email} (${d.driverType})`);
  }

  // ── Lojista com produtos no marketplace ───────────────────────────────
  const lojistaUser = await prisma.user.upsert({
    where: { email: 'lojista@giucar.com.br' },
    update: {},
    create: {
      name: 'Loja GIUCAR Insumos',
      email: 'lojista@giucar.com.br',
      phone: '+5511977776666',
      passwordHash,
      // Store.ownerUserId so aceita LAVADOR ou ADMIN (StoreController
      // exige @Roles(LAVADOR, ADMIN)) — ver services/api/src/modules/store/store.controller.ts
      role: UserRole.LAVADOR,
    },
  });

  let store = await prisma.store.findUnique({ where: { ownerUserId: lojistaUser.id } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerUserId: lojistaUser.id,
        name: 'Loja GIUCAR Insumos',
        document: '12.345.678/0001-90',
        contactName: 'Fábio Loja',
        email: 'contato@lojagiucar.com.br',
        phone: '+5511977776666',
        storeType: StoreType.CLIENTE,
        logisticsPlan: LogisticsPlan.INTEGRATED,
        status: StoreStatus.active,
      },
    });
    await prisma.commissionPlan.create({
      data: {
        storeId: store.id,
        storeType: StoreType.CLIENTE,
        logisticsPlan: LogisticsPlan.INTEGRATED,
        monthlyFee: 59,
        takeRate: 0.18,
      },
    });
  }
  console.log(`Lojista: ${lojistaUser.email} / Loja: ${store.name}`);

  const produtosData = [
    { name: 'Shampoo Automotivo 500ml', slug: 'shampoo-automotivo-500ml', sku: 'GIU-SHP-500', price: 29.9, stock: 50, category: 'Limpeza' },
    { name: 'Cera Automotiva Premium', slug: 'cera-automotiva-premium', sku: 'GIU-CERA-PREM', price: 49.9, stock: 30, category: 'Proteção' },
    { name: 'Kit Microfibra (3un)', slug: 'kit-microfibra-3un', sku: 'GIU-MICROFIBRA-3', price: 19.9, stock: 100, category: 'Acessórios' },
  ];
  for (const p of produtosData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { sku: p.sku },
      create: {
        storeId: store.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        description: p.name,
        category: p.category,
        price: p.price,
        stockQuantity: p.stock,
        status: ProductStatus.active,
        catalogTarget: CatalogTarget.AMBOS,
        approvedAt: new Date(),
      },
    });
  }
  console.log(`Produtos: ${produtosData.length} no catálogo`);

  // ── Pedidos de exemplo (1 por status) ─────────────────────────────────
  const existingSeedOrder = await prisma.order.findFirst({ where: { notes: { startsWith: SEED_MARKER } } });
  if (existingSeedOrder) {
    console.log('\nPedidos de exemplo já existem — pulando (rode com um banco limpo pra recriar).');
  } else {
    const moto = lavadores[0].profileUserId;
    const carro = lavadores[1].profileUserId;

    const baseOrder = (
      overrides: Partial<Prisma.OrderUncheckedCreateInput> &
        Pick<Prisma.OrderUncheckedCreateInput, 'customerId' | 'vehicleId' | 'addressId' | 'status'>,
    ): Prisma.OrderUncheckedCreateInput => ({
      totalAmount: 80,
      notes: `${SEED_MARKER} pedido de exemplo`,
      serviceType: ServiceType.DRY_WASH,
      zoneId: zone.id,
      items: { create: [{ name: 'Lavagem completa', price: 80, quantity: 1 }] },
      ...overrides,
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[0].user.id,
        vehicleId: clientes[0].vehicleId,
        addressId: clientes[0].addressId,
        status: OrderStatus.pending,
      }),
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[1].user.id,
        vehicleId: clientes[1].vehicleId,
        addressId: clientes[1].addressId,
        status: OrderStatus.searching_washer,
      }),
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[2].user.id,
        vehicleId: clientes[2].vehicleId,
        addressId: clientes[2].addressId,
        driverId: moto,
        status: OrderStatus.accepted,
      }),
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[0].user.id,
        vehicleId: clientes[0].vehicleId,
        addressId: clientes[0].addressId,
        driverId: carro,
        status: OrderStatus.en_route,
      }),
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[1].user.id,
        vehicleId: clientes[1].vehicleId,
        addressId: clientes[1].addressId,
        driverId: carro,
        status: OrderStatus.in_progress,
        startedAt: new Date(),
      }),
    });

    const completedOrder = await prisma.order.create({
      data: baseOrder({
        customerId: clientes[2].user.id,
        vehicleId: clientes[2].vehicleId,
        addressId: clientes[2].addressId,
        driverId: carro,
        status: OrderStatus.completed,
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        completedAt: new Date(),
      }),
    });
    await prisma.payment.create({
      data: {
        orderId: completedOrder.id,
        userId: clientes[2].user.id,
        method: PaymentMethod.pix,
        status: PaymentStatus.paid,
        amount: completedOrder.totalAmount,
      },
    });
    const loyaltyAmount = Math.round(Number(completedOrder.totalAmount) * POINTS_PER_REAL);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRY_DAYS);
    await prisma.loyaltyPoint.create({
      data: { userId: clientes[2].user.id, orderId: completedOrder.id, amount: loyaltyAmount, expiresAt },
    });

    await prisma.order.create({
      data: baseOrder({
        customerId: clientes[0].user.id,
        vehicleId: clientes[0].vehicleId,
        addressId: clientes[0].addressId,
        status: OrderStatus.cancelled,
      }),
    });

    console.log('Pedidos: 7 criados (1 por status), incluindo pagamento + pontos de fidelidade no concluído.');
  }

  // ── Catálogo de veículos (marca → modelo → ano) ──────────────────────
  // Conjunto representativo, não exaustivo — não há integração real a
  // FIPE/TecDoc. Uma marca com 2 modelos populares cada, anos 2015-2024.
  const CATALOG: {
    brand: string;
    models: { name: string; vehicleType: VehicleType }[];
  }[] = [
    { brand: 'Volkswagen', models: [{ name: 'Gol', vehicleType: VehicleType.carro }, { name: 'T-Cross', vehicleType: VehicleType.carro }] },
    { brand: 'Fiat', models: [{ name: 'Argo', vehicleType: VehicleType.carro }, { name: 'Toro', vehicleType: VehicleType.caminhonete }] },
    { brand: 'Chevrolet', models: [{ name: 'Onix', vehicleType: VehicleType.carro }, { name: 'Tracker', vehicleType: VehicleType.carro }] },
    { brand: 'Ford', models: [{ name: 'Ka', vehicleType: VehicleType.carro }, { name: 'Ranger', vehicleType: VehicleType.caminhonete }] },
    { brand: 'Toyota', models: [{ name: 'Corolla', vehicleType: VehicleType.carro }, { name: 'Hilux', vehicleType: VehicleType.caminhonete }] },
    { brand: 'Honda', models: [{ name: 'Civic', vehicleType: VehicleType.carro }, { name: 'CG 160', vehicleType: VehicleType.moto }] },
    { brand: 'Hyundai', models: [{ name: 'HB20', vehicleType: VehicleType.carro }, { name: 'Creta', vehicleType: VehicleType.carro }] },
    { brand: 'Renault', models: [{ name: 'Kwid', vehicleType: VehicleType.carro }, { name: 'Duster', vehicleType: VehicleType.carro }] },
  ];
  const CATALOG_YEARS = Array.from({ length: 10 }, (_, i) => 2015 + i);

  let catalogYearsCreated = 0;
  for (const { brand: brandName, models } of CATALOG) {
    const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brand = await prisma.vehicleBrand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName, slug, active: true },
    });

    for (const { name: modelName, vehicleType } of models) {
      const model = await prisma.vehicleCatalogModel.upsert({
        where: { brandId_name: { brandId: brand.id, name: modelName } },
        update: {},
        create: { brandId: brand.id, name: modelName, vehicleType, active: true },
      });

      for (const year of CATALOG_YEARS) {
        await prisma.vehicleCatalogYear.upsert({
          where: { modelId_year: { modelId: model.id, year } },
          update: {},
          create: { modelId: model.id, year, active: true },
        });
        catalogYearsCreated += 1;
      }
    }
  }
  console.log(`\nCatálogo de veículos: ${CATALOG.length} marcas, ${CATALOG.reduce((n, b) => n + b.models.length, 0)} modelos, ${catalogYearsCreated} combinações de ano.`);

  // ── Matriz de preços — Serviços Auto / Lavagem por tamanho ───────────
  const WASH_PRICE_MATRIX: { carSize: CarSize; washType: WashType; price: number }[] = [
    { carSize: CarSize.PEQUENO, washType: WashType.SECO, price: 29.9 },
    { carSize: CarSize.PEQUENO, washType: WashType.EXPRESSA, price: 39.9 },
    { carSize: CarSize.PEQUENO, washType: WashType.COMPLETA, price: 69.9 },
    { carSize: CarSize.PEQUENO, washType: WashType.HIGIENIZACAO_INTERNA, price: 119.9 },
    { carSize: CarSize.PEQUENO, washType: WashType.POLIMENTO, price: 189.9 },
    { carSize: CarSize.MEDIO, washType: WashType.SECO, price: 39.9 },
    { carSize: CarSize.MEDIO, washType: WashType.EXPRESSA, price: 49.9 },
    { carSize: CarSize.MEDIO, washType: WashType.COMPLETA, price: 89.9 },
    { carSize: CarSize.MEDIO, washType: WashType.HIGIENIZACAO_INTERNA, price: 149.9 },
    { carSize: CarSize.MEDIO, washType: WashType.POLIMENTO, price: 229.9 },
    { carSize: CarSize.GRANDE, washType: WashType.SECO, price: 49.9 },
    { carSize: CarSize.GRANDE, washType: WashType.EXPRESSA, price: 59.9 },
    { carSize: CarSize.GRANDE, washType: WashType.COMPLETA, price: 109.9 },
    { carSize: CarSize.GRANDE, washType: WashType.HIGIENIZACAO_INTERNA, price: 189.9 },
    { carSize: CarSize.GRANDE, washType: WashType.POLIMENTO, price: 279.9 },
  ];
  for (const entry of WASH_PRICE_MATRIX) {
    await prisma.washPriceMatrix.upsert({
      where: { carSize_washType: { carSize: entry.carSize, washType: entry.washType } },
      update: { price: entry.price },
      create: { carSize: entry.carSize, washType: entry.washType, price: entry.price, active: true },
    });
  }
  console.log(`Matriz de preços (Lavagem por tamanho): ${WASH_PRICE_MATRIX.length} combinações.`);

  console.log(`\nSenha de todos os usuários de seed: ${SEED_PASSWORD}`);
  console.log('Concluído.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
