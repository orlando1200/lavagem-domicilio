}

// Categorias
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  active: boolean;
  createdAt: string;
  servicesCount?: number;
}

// Serviços
export type VehicleSize = 'small' | 'medium' | 'large' | 'suv' | 'truck';











  price: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  category?: Category;
  serviceMode?: 'main' | 'addon' | 'premium' | 'marketplace_related';
  estimatedDurationMinutes?: number;
  requiresSpecialEquipment?: boolean;
  requiresCertification?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  prices: ServicePrice[];
  active: boolean;
  createdAt: string;
}

// Zonas
export interface Zone {






  createdAt: string;
}

// Usuários
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'washer' | 'admin' | 'super_admin';
  active: boolean;
  createdAt: string;
  ordersCount?: number;
  profile?: {
    fullName?: string;
    cpf?: string;
    avatarUrl?: string;
  };
  clientProfile?: {
    totalOrders?: number;
  };
  driverProfile?: {
    id?: string;
    status?: string;
    averageRating?: number;
    totalCompletedOrders?: number;
  };
}

// Lavadores
export interface Washer {
  id: string;
  userId: string;
  user: User;
  zoneId?: string;
  zone?: Zone;
  rating: number;
  completedOrders: number;
  active: boolean;
  verifiedAt?: string;
  createdAt: string;
  status?: string;
  availableNow?: boolean;
  onlineStatus?: string;
  currentZone?: Zone;
}

// Pedidos
export type OrderStatus =


































































  customer: User;
  washerId?: string;
  washer?: Washer;
  serviceId?: string | null;
  service?: Service | null;
  vehicleSize: VehicleSize;
  address: string;
  addressLat?: number;








  updatedAt: string;
}

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[] | '';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  washerId?: string;
}

// Cupons
export type CouponType = 'percentage' | 'fixed';




















































































































































































































































































// ─── Marketplace ─────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Ativo',














export type ProductStatus = 'draft' | 'active' | 'inactive' | 'out_of_stock';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  inactive: 'Inativo',
  out_of_stock: 'Sem estoque',
};

export const PRODUCT_STATUS_COLORS: Record<
  ProductStatus,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  draft: 'default',
  active: 'success',
  inactive: 'secondary',
  out_of_stock: 'warning',
};

export interface Supplier {
  id: string;









































































































































































// ─── Kit Inicial ──────────────────────────────────────────────────────────────

export interface StarterKitConfig {
  id: string;
  productId: string;
  product?: MarketplaceProduct;
  minPrice: number;
  maxPrice: number;
  maxInstallments: number;
  active: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

